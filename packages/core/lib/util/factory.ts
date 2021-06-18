import { CIdentifier, CNode, CNumericLiteral, CPropertyAccessExpression } from '../parser';
import { Token, TokenType } from '../tokenizer';

/**
 * 创建 Token
 * @param tokenType token类型
 * @param val token值字符串
 * @param line token处于哪一行
 * @param off token处于哪一列
 */
export function createToken(tokenType: TokenType, val: string, line: number, off: number): Token {
  return new Token(tokenType, val, line, off - val.length);
}


export function customCreateNumericLiteral(text: string, parent: CNode | null = null): CNumericLiteral {
  return new CNumericLiteral(text, parent);
}

// 创建标识符
export function customCreateIdentifier(escapedText: string, parent: CNode | null = null): CIdentifier {
  return new CIdentifier(escapedText, parent);
}

// 创建属性访问 xx.yy.zz
export function customCreatePropertyAccessExpression(s: string): CPropertyAccessExpression {
  if (!s.includes('\.')) return null;
  const sl = s.split('\.');
  let i = sl.length - 1;
  const res = new CPropertyAccessExpression(null, customCreateIdentifier(sl[i]));
  res.namespace = sl[0];
  let next = res;

  i--;
  while (i >= 0) {
    if (i >= 1) {
      // 多个属性共建 xx.yy.zz.kk
      next.expression = new CPropertyAccessExpression(null, customCreateIdentifier(sl[i]));
      next = next.expression;
    } else {
      // 单个属性 xx.yy
      next.expression = customCreateIdentifier(sl[i]);
    }
    i--;
  }
  return res;
}

