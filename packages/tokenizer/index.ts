import { TokenType } from './lib/define';
import Tokenizer from './lib/tokenizer';

export * from './lib/define';

export class Token implements Token {
  type: TokenType;
  value: string;
  line: number;
  offset: number;

  constructor(type: TokenType, value: string, line?: number, offset?: number) {
    this.type = type;
    this.value = value;
    this.offset = offset;
    this.line = line;
  }
}

export function tokenize(source: string): Token[] {
  const t = new Tokenizer(source);
  const result: Token[] = [];

  let isInBlock = false;
  let isSmallBracket = false;
  let tk = t.next();

  while (tk) {
    // 确定某些关键字的位置，处于 isInBlock 指外，为关键字，否则为普通的字符
    switch (tk) {
      case 'syntax':
      case 'package':
      case 'option':
      case 'repeated':
      case 'import':
      case 'service':
      case 'message':
      case 'enum':
        result.push(new Token(isInBlock ? TokenType.VARIABLE : TokenType.KEYWORD, tk, t.line, t.offset));
        break;

      case 'rpc':
      case 'returns':
        result.push(new Token(isInBlock ? TokenType.KEYWORD : TokenType.VARIABLE, tk, t.line, t.offset));
        break;

      case ';':
      case '"':
      case '\'':
      case ':':
        result.push(new Token(TokenType.SYMBOL, tk, t.line, t.offset));
        break;

      case '{':
        isInBlock = true;
        result.push(new Token(TokenType.SYMBOL, tk, t.line, t.offset));
        break;
      case '(':
        isSmallBracket = true;
        result.push(new Token(TokenType.SYMBOL, tk, t.line, t.offset));
        break;

      case '}':
        isInBlock = false;
        result.push(new Token(TokenType.SYMBOL, tk, t.line, t.offset));
        break;
      case ')':
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        isSmallBracket = false;
        result.push(new Token(TokenType.SYMBOL, tk, t.line, t.offset));
        break;

      case '=':
        result.push(new Token(TokenType.OPERATOR, tk, t.line, t.offset));
        break;

      default:
        result.push(new Token(TokenType.VARIABLE, tk, t.line, t.offset))
    }

    tk = t.next();
  }
  return result;
}
