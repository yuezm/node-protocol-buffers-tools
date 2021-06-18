import { TokenType } from './define';
import Tokenizer from './tokenizer';
import { createToken } from '../util';


export * from './define';

export class Token {
  type: TokenType;
  value: string;
  line: number;
  start: number;
  end: number;

  constructor(type: TokenType, value: string, line?: number, start?: number) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.start = start;
    this.end = start + value.length - 1;
  }
}

export function tokenize(source: string): Token[] {
  const t = new Tokenizer(source, true);
  const result: Token[] = [];

  let tk = t.next();

  while (tk) {
    switch (tk) {
      case 'syntax':
      case 'package':
      case 'option':
      case 'repeated':
      case 'import':
      case 'service':
      case 'message':
      case 'enum':
        result.push(createToken(TokenType.KEYWORD, tk, t.line, t.lineOffset));
        break;

      case 'rpc':
      case 'returns':
        result.push(createToken(TokenType.KEYWORD, tk, t.line, t.lineOffset));
        break;

      case ';':
      case '"':
      case '\'':
      case ':':
        result.push(createToken(TokenType.SYMBOL, tk, t.line, t.lineOffset));
        break;

      case '{':
        result.push(createToken(TokenType.SYMBOL, tk, t.line, t.lineOffset));
        break;
      case '(':
        result.push(createToken(TokenType.SYMBOL, tk, t.line, t.lineOffset));
        break;

      case '}':
        result.push(createToken(TokenType.SYMBOL, tk, t.line, t.lineOffset));
        break;
      case ')':
        result.push(createToken(TokenType.SYMBOL, tk, t.line, t.lineOffset));
        break;

      case '=':
        result.push(createToken(TokenType.OPERATOR, tk, t.line, t.lineOffset));
        break;

      default:
        result.push(createToken(TokenType.VARIABLE, tk, t.line, t.lineOffset))
    }

    tk = t.next();
  }
  return result;
}
