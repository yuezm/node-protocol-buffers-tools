import { TokenType } from './lib/define';
import Tokenizer from './lib/tokenizer';
import { createToken } from 'Tokenizer/lib/factory';


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
        result.push(createToken(isInBlock ? TokenType.VARIABLE : TokenType.KEYWORD, tk, t.line, t.lineOffset));
        break;

      case 'rpc':
      case 'returns':
        result.push(createToken(isInBlock ? TokenType.KEYWORD : TokenType.VARIABLE, tk, t.line, t.lineOffset));
        break;

      case ';':
      case '"':
      case '\'':
      case ':':
        result.push(createToken(TokenType.SYMBOL, tk, t.line, t.lineOffset));
        break;

      case '{':
        isInBlock = true;
        result.push(createToken(TokenType.SYMBOL, tk, t.line, t.lineOffset));
        break;
      case '(':
        isSmallBracket = true;
        result.push(createToken(TokenType.SYMBOL, tk, t.line, t.lineOffset));
        break;

      case '}':
        isInBlock = false;
        result.push(createToken(TokenType.SYMBOL, tk, t.line, t.lineOffset));
        break;
      case ')':
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        isSmallBracket = false;
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
