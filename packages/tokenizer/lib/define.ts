export enum TokenType {
  KEYWORD = 1, // pb自有关键字，例如 syntax，package
  OPERATOR = 2, // 操作符，例如 =
  SYMBOL = 3, // 例如分号，引号等
  VARIABLE = 4, // 变量
}


export interface IToken {
  // token
  type: TokenType;
  value: string;

  // 记录位置信息
  line?: number;
  offset?: number;
}
