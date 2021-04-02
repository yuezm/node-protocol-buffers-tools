import { GOOGLE_BASE_NUMBER_TYPES, NodeFlags, ParserOptions, SyntaxKind } from './define';
import { Token } from 'tokenizer';
import * as factory from './helper/factory';
import { createIdentifier } from './helper/factory';
import {
  EnumDeclaration,
  EnumElement,
  Expression,
  FunctionDeclaration,
  ImportExpression,
  KeyWordTypeNode,
  MessageDeclaration,
  MessageElement,
  NumericLiteral,
  PropertyAccessExpression,
  ServiceDeclaration,
  TypeNode,
  TypeReferenceNode
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

  constructor(options: ParserOptions) {
    this.source = options.source;
    this.filename = options.filename;

    this.offset = 0;
  }

  illegal(token: Token): Error {
    return Error(`illegal ${ token.value } in ${ this.filename } on line ${ token.line }`);
  }

  // 返回当前的Token，并移动游标
  next(): Token | null {
    return this.offset === this.source.length ? null : this.source[this.offset++];
  }

  prev(): Token | null {
    return this.offset > 0 ? this.source[this.offset - 1] : null;
  }

  // 返回当前的Token
  now(): Token | null {
    return this.offset === this.source.length ? null : this.source[this.offset];
  }

  // 越过下一个匹配的Token
  skip(val: string): void {
    if (this.source[this.offset].value === val) {
      this.offset++;
    }
  }

  skipRe(val: RegExp) {
    if (val.test(this.source[this.offset].value)) {
      this.offset++;
    }
  }

  parseNumber(token: Token): NumericLiteral {
    return factory.createNumericLiteral(this.serializeNumber(token).toString())
  }

  parsePackage(): void {
    const token = this.next();
    if (this.package !== undefined) throw this.illegal(token);
    if (!TYPE_REF_RE.test(token.value)) throw this.illegal(token);
    this.package = token.value;
  }

  parseImport(): Expression {
    this.skip('"');
    const token = this.next();
    const syt = new ImportExpression(factory.createIdentifier(token.value));
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

  parseService(): ServiceDeclaration {
    const token = this.next(); // 进入service
    this.skip('{');
    return new ServiceDeclaration(factory.createIdentifier(token.value), []);
  }

  parseMethod(parent: ServiceDeclaration | null): FunctionDeclaration {
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

    return new FunctionDeclaration(
      createIdentifier(name),
      this.parseTypeNode(params.value),
      this.parseTypeNode(returns.value),
      parent
    )
  }

  parseMessage(): MessageDeclaration {
    const token = this.next();
    this.skip('{');
    return new MessageDeclaration(factory.createIdentifier(token.value), []);
  }

  parseMessageElement(parent: MessageDeclaration | null): MessageElement {
    if (parent === null) throw this.illegal(this.now());

    const type = this.prev();
    const name = this.next();

    this.skip('=');
    this.skipRe(/\d+/);
    this.skip(';');

    // 确定类型是否为 xx.yy 这样的获取，目前只做两层处理哈，后续在写递归
    return new MessageElement(factory.createIdentifier(name.value), this.parseTypeNode(type.value), parent);
  }

  parsePropertyAccess(s: string): PropertyAccessExpression {
    const sl = s.split('\.');
    let i = sl.length - 1;
    const res = new PropertyAccessExpression(null, createIdentifier(sl[i]));
    res.namespace = sl[0];
    let next = res;

    i--;
    while (i >= 0) {
      if (i >= 1) {
        // 多个属性共建 xx.yy.zz.kk
        next.expression = new PropertyAccessExpression(null, createIdentifier(sl[i]));
        next = next.expression;
      } else {
        // 单个属性 xx.yy
        next.expression = createIdentifier(sl[i]);
      }
      i--;
    }
    return res;
  }

  parseTypeNode(s: string): TypeNode {
    let typeSyt: TypeNode;
    if (s.includes('\.')) {
      typeSyt = new TypeReferenceNode(this.parsePropertyAccess(s));
    } else {
      if (s === 'string') {
        typeSyt = new KeyWordTypeNode(SyntaxKind.StringKeyWord);
      } else if (s === 'bool') {
        typeSyt = new KeyWordTypeNode(SyntaxKind.BooleanKeyWord);
      } else if (GOOGLE_BASE_NUMBER_TYPES.has(s)) {
        typeSyt = new KeyWordTypeNode(SyntaxKind.NumberKeyWord);
        typeSyt.flags = NodeFlags.GoogleNumber; // 专属标记Google数字类型
      } else {
        // 对于pb来说，如果非普通变量，且未指定命名空间，则是自身
        // typeSyt = new TypeReferenceNode(factory.createIdentifier(s));
        typeSyt = new TypeReferenceNode(this.parsePropertyAccess(`${ this.package }.${ s }`));
      }
    }
    return typeSyt;
  }

  parseEnum(): EnumDeclaration {
    const token = this.next();
    this.skip('{');
    return new EnumDeclaration(factory.createIdentifier(token.value), [])
  }

  parseEnumElement(parent: EnumDeclaration | null): EnumElement {
    if (parent === null) throw this.illegal(this.now());
    const name = this.prev();
    this.skip('=');
    const init = this.next();
    this.skip(';');
    return new EnumElement(factory.createIdentifier(name.value), new KeyWordTypeNode(SyntaxKind.NumberKeyWord), this.parseNumber(init), parent);
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
