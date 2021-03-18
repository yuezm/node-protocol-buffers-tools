import { Token } from 'tokenizer';
import { Node } from './types';

export interface ParserOptions {
  source: Token[];
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

export interface Visitor {
  visitor: Partial<{
    [attr in SyntaxKind]: (node: Node) => void;
  }>;
}

