import { Token } from '../tokenizer';
import { CNode } from './types';

export interface ParserOptions {
  source: Token[];
  filename: string;
}

export enum CSyntaxKind {
  Unknown = 0,

  Module, // 文件模块

  Expression, // 表达式
  PackageExpression, // package 表达式
  ImportExpression, // import 表达式
  PropertyAccessExpression, // 属性获取表达式 xx.yy

  Identifier, // 标识符

  ServiceDeclaration, // service 声明
  FunctionDeclaration, // 方法声明
  MessageDeclaration, // messages声明
  MessageElement, // message 内部单元
  EnumDeclaration, // 枚举声明
  EnumElement, // 枚举内部单元

  NumericLiteral, // 数字字面量
  StringLiteral, // 字符串字面量

  TypeNode,

  StringKeyWord,
  NumberKeyWord,
  BooleanKeyWord,
  TypeReference
}

export type CKeyWordType = CSyntaxKind.StringKeyWord | CSyntaxKind.NumberKeyWord | CSyntaxKind.BooleanKeyWord;

export enum CNodeFlags {
  Unknown = 0,
  BlockScoped = 1,
  Reference, // 表示是否是引用的变量
  GoogleNumber,
}

export interface CVisitor {
  visitor: Partial<{
    [attr in CSyntaxKind]: (node: CNode) => void;
  }>;
}

export const GOOGLE_BASE_NUMBER_TYPES = new Set([ 'double', 'float', 'int32', 'int64', 'uint32', 'uint64', 'sint32', 'sint64', 'fixed32', 'fixed64', 'sfixed32', 'sfixed64', 'bytes' ]);
export const Google_BASE_TYPES = new Set([ ...GOOGLE_BASE_NUMBER_TYPES, 'bool', 'string', ]);

