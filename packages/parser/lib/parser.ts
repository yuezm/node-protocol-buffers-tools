import { GOOGLE_BASE_NUMBER_TYPES, CNodeFlags, ParserOptions, CSyntaxKind } from './define';
import { Token } from 'tokenizer';
import * as factory from './helper/factory';
import { customCreateIdentifier, customCreatePropertyAccessExpression } from './helper/factory';
import {
  CEnumDeclaration,
  CEnumElement,
  CExpression,
  CFunctionDeclaration,
  CImportExpression,
  CKeyWordTypeNode,
  CMessageDeclaration,
  CMessageElement,
  CNumericLiteral,
  CServiceDeclaration,
  CTypeNode,
  CTypeReferenceNode
} from './types';


const BASE_10_RE = /^[1-9][0-9]*$/;
const BASE_10_NEG_RE = /^-?[1-9][0-9]*$/;
const BASE_16_RE = /^0[x][0-9a-fA-F]+$/;
const BASE_16_NEG_RE = /^-?0[x][0-9a-fA-F]+$/;
const BASE_8_RE = /^0[0-7]+$/;
const BASE_8_NEG_RE = /^-?0[0-7]+$/;
const NUMBER_RE = /^(?![eE])[0-9]*(?:\.[0-9]*)?(?:[eE][+-]?[0-9]+)?$/;
const NAME_RE = /^[a-zA-Z_][a-zA-Z_0-9]*$/;
const TYPE_REF_RE = /^(?:\.?[a-zA-Z_][a-zA-Z_0-9]*)(?:\.[a-zA-Z_][a-zA-Z_0-9]*)*$/;
const FQ_TYPE_REF_RE = /^(?:\.[a-zA-Z_][a-zA-Z_0-9]*)+$/;

export default class Parser {
  source: Token[];

  filename: string;
  package: string | undefined;
  syntax: string | undefined;

  offset: number;

  enums: string[];
  messages: string[];

  constructor(options: ParserOptions) {
    this.source = options.source;
    this.filename = options.filename;

    this.offset = 0;

    this.enums = [];
    this.messages = [];
  }

  illegal(token: Token | null): Error {
    if (!token) return Error('UnknownError');
    return Error(`illegal ${ token.value } in ${ this.filename } on line ${ token.line }, start ${ token.start }, end ${ token.end }`);
  }

  // 返回当前的Token，并移动游标
  next(): Token | null {
    return this.offset === this.source.length ? null : this.source[this.offset++];
  }

  // 返回当前的Token
  now(): Token | null {
    return this.offset === this.source.length ? null : this.source[this.offset];
  }

  prev(): Token | null {
    return this.offset > 0 ? this.source[this.offset - 1] : null;
  }

  // 越过下一个匹配的Token
  skip(val: string): void {
    if (this.source[this.offset].value === val) this.offset++;
  }

  skipRe(val: RegExp): void {
    if (val.test(this.source[this.offset].value)) this.offset++;
  }

  parseNumber(token: Token): CNumericLiteral {
    return factory.customCreateNumericLiteral(this.serializeNumber(token).toString())
  }

  parsePackage(): void {
    const token = this.next();
    if (this.package !== undefined) throw this.illegal(token);
    if (!TYPE_REF_RE.test(token.value)) throw this.illegal(token);
    this.package = token.value;
  }

  parseImport(): CExpression {
    this.skip('"');
    const token = this.next();
    const syt = new CImportExpression(factory.customCreateIdentifier(token.value));
    this.skip('"');
    return syt;
  }

  parseSyntax(): void {
    // 根据 syntax 语法，跳过符号
    this.skip('=');
    this.skip('"');

    this.syntax = this.next().value;

    this.skip('"');
    this.skip(';');
  }

  parseService(): CServiceDeclaration {
    const token = this.next(); // 进入service
    this.skip('{');
    return new CServiceDeclaration(factory.customCreateIdentifier(token.value), []);
  }

  parseMethod(parent: CServiceDeclaration | null): CFunctionDeclaration {
    if (parent === null) throw this.illegal(this.now());

    const name = this.next().value;
    this.skip('(');
    const params = this.next();

    this.skip(')');
    this.skip('returns');
    this.skip('(');

    const returns = this.next();

    this.skip(')');
    this.skip(';');

    return new CFunctionDeclaration(
      customCreateIdentifier(name),
      this.parseTypeNode(params.value),
      this.parseTypeNode(returns.value),
      parent
    )
  }

  parseMessage(): CMessageDeclaration {
    const token = this.next();
    this.skip('{');
    this.messages.push(token.value);
    return new CMessageDeclaration(factory.customCreateIdentifier(token.value), []);
  }

  parseMessageElement(parent: CMessageDeclaration | null): CMessageElement {
    if (parent === null) throw this.illegal(this.now());

    const type = this.prev();
    const name = this.next();

    this.skip('=');
    this.skipRe(/\d+/);
    this.skip(';');

    // 确定类型是否为 xx.yy 这样的获取，目前只做两层处理哈，后续在写递归
    return new CMessageElement(factory.customCreateIdentifier(name.value), this.parseTypeNode(type.value), parent);
  }

  parseTypeNode(s: string): CTypeNode {
    let typeSyt: CTypeNode;
    if (s.includes('\.')) {
      typeSyt = new CTypeReferenceNode(customCreatePropertyAccessExpression(s));
    } else {
      if (s === 'string') {
        typeSyt = new CKeyWordTypeNode(CSyntaxKind.StringKeyWord);
      } else if (s === 'bool') {
        typeSyt = new CKeyWordTypeNode(CSyntaxKind.BooleanKeyWord);
      } else if (GOOGLE_BASE_NUMBER_TYPES.has(s)) {
        typeSyt = new CKeyWordTypeNode(CSyntaxKind.NumberKeyWord);
        typeSyt.flags = CNodeFlags.GoogleNumber; // 专属标记Google数字类型
      } else {
        // 对于pb来说，如果非普通变量，且未指定命名空间，则是自身
        // typeSyt = new TypeReferenceNode(factory.createIdentifier(s));
        typeSyt = new CTypeReferenceNode(customCreatePropertyAccessExpression(`${ this.package }.${ s }`));
      }
    }
    return typeSyt;
  }

  parseEnum(): CEnumDeclaration {
    const token = this.next();
    this.skip('{');
    this.enums.push(token.value);
    return new CEnumDeclaration(factory.customCreateIdentifier(token.value), [])
  }

  parseEnumElement(parent: CEnumDeclaration | null): CEnumElement {
    if (parent === null) throw this.illegal(this.now());
    const name = this.prev();
    this.skip('=');
    const init = this.next();
    this.skip(';');
    return new CEnumElement(factory.customCreateIdentifier(name.value), new CKeyWordTypeNode(CSyntaxKind.NumberKeyWord), this.parseNumber(init), parent);
  }

  serializeNumber(token: Token): number | string {
    let { value } = token;
    let sign = 1;

    // 确定正负
    if (value.charAt(0) === '-') {
      sign = -1;
      value = value.substring(1);
    }

    switch (value) {
      case 'inf':
      case 'INF':
      case 'Inf':
        return sign * Infinity;
      case 'nan':
      case 'NAN':
      case 'Nan':
      case 'NaN':
        return NaN;
      case '0':
        return 0;
    }
    if (BASE_10_RE.test(value)) return sign * parseInt(value, 10);
    if (BASE_16_RE.test(value)) return sign * parseInt(value, 16);
    if (BASE_8_RE.test(value)) return sign * parseInt(value, 8);

    /* istanbul ignore else */
    if (NUMBER_RE.test(value)) return sign * parseFloat(value);

    /* istanbul ignore next */
    throw this.illegal(token);
  }
}
