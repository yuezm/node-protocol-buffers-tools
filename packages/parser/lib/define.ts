import { IToken } from 'tokenizer/lib/define';

export interface IParserOptions {
  source: IToken[];
  filename: string;
}

export enum SyntaxKind {
  Unknown = 0,

  Module,

  Expression,
  PackageExpression,
  ImportExpression,
  PropertyAccessExpression,

  Identifier,

  Literal,
  NumericLiteral,
  StringLiteral,

  ServiceDeclaration,
  FunctionDeclaration,
  MessageDeclaration,
  MessageElement,
  EnumDeclaration,
  EnumElement
}

export enum NodeFlags {
  Unknown = 0,
  BlockScoped = 1,
}



