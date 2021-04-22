import { TokenType } from 'Tokenizer/lib/define';
import { Token } from 'Tokenizer/index';

export function createToken(tokenType: TokenType, val: string, line: number, off: number): Token {
  return new Token(tokenType, val, line, off - val.length);
}
