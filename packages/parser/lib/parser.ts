import { IParserOptions, SyntaxKind } from './define';
import { IToken } from 'tokenizer/lib/define';
import { createExpression, createFunctionDeclaration, createIdentifier, createNumericLiteral } from './helper';
import {
  EnumDeclaration,
  EnumElement,
  Expression,
  FunctionDeclaration, Identifier,
  MessageDeclaration,
  MessageElement,
  NumericLiteral,
  PropertyAccessExpression,
  ServiceDeclaration
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
  source: IToken[];


  filename: string;
  package: string | undefined;
  syntax: string | undefined;

  offset: number;

  constructor(options: IParserOptions) {
    this.source = options.source;
    this.filename = options.filename;

    this.offset = 0;
  }

  illegal(token: IToken): Error {
    return Error(`illegal ${ token.value } in ${ this.filename } on line ${ token.line }`);
  }

  // 返回当前的Token，并移动游标
  next(): IToken | null {
    return this.offset === this.source.length ? null : this.source[this.offset++];
  }

  prev(): IToken | null {
    return this.offset > 0 ? this.source[this.offset - 1] : null;
  }

  // 返回当前的Token
  now(): IToken | null {
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

  parseNumber(token: IToken): NumericLiteral {
    return createNumericLiteral(this.serializeNumber(token).toString())
  }

  parsePackage(): Expression {
    const token = this.next();
    if (this.package !== undefined) throw this.illegal(token);
    if (!TYPE_REF_RE.test(token.value)) throw this.illegal(token);

    this.package = token.value;
    return createExpression(token.value, SyntaxKind.PackageExpression);
  }

  parseImport(): Expression {
    this.skip('"');
    const token = this.next();
    const syt = createExpression(token.value, SyntaxKind.ImportExpression);
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
    return new ServiceDeclaration(createIdentifier(token.value), []);
  }

  parseMethod(parent: ServiceDeclaration | null): FunctionDeclaration {
    if (parent === null) throw this.illegal(this.now());

    const name = this.next().value;
    this.skip('(');

    const params = this.next().value;

    this.skip(')');
    this.skip('returns');
    this.skip('(');

    const returns = this.next().value;
    this.skip(')');
    this.skip(';');

    return createFunctionDeclaration(name, params, returns, parent);
  }

  parseMessage(): MessageDeclaration {
    const token = this.next();
    this.skip('{');
    return new MessageDeclaration(createIdentifier(token.value), []);
  }

  parseMessageElement(parent: MessageDeclaration | null): MessageElement {
    if (parent === null) throw this.illegal(this.now());

    const type = this.prev();
    const name = this.next();

    this.skip('=');
    this.skipRe(/\d+/);
    this.skip(';');


    // 确定类型是否为 xx.yy 这样的获取，目前只做两层处理哈，后续在写递归
    let typeSyt: Identifier | PropertyAccessExpression;
    if (type.value.includes('\.')) {
      const typeList = type.value.split('\.');
      typeSyt = new PropertyAccessExpression(createIdentifier(typeList[0]), createIdentifier(typeList[1]));
    } else {
      typeSyt = createIdentifier(type.value);
    }

    return new MessageElement(createIdentifier(name.value), typeSyt, parent);
  }

  parseEnum(): EnumDeclaration {
    const token = this.next();
    this.skip('{');
    return new EnumDeclaration(createIdentifier(token.value), [])
  }

  parseEnumElement(parent: EnumDeclaration | null): EnumElement {
    if (parent === null) throw this.illegal(this.now());
    const name = this.prev();
    this.skip('=');
    const init = this.next();
    this.skip(';');
    return new EnumElement(createIdentifier(name.value), this.parseNumber(init), parent);
  }

  serializeNumber(token: IToken): number | string {
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
