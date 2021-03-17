import * as types from './types';
import { SyntaxKind } from './define';

export function createNumericLiteral(text: string, parent: types.Node | null = null): types.NumericLiteral {
  return new types.NumericLiteral(text, parent);
}

export function createStringLiteral(text: string, parent: types.Node | null = null): types.StringLiteral {
  return new types.StringLiteral(text, parent);
}

// 创建标识符
export function createIdentifier(escapedText: string, parent: types.Node | null = null): types.Identifier {
  return new types.Identifier(escapedText, parent);
}

export function createExpression(escapedText: string, kind?: SyntaxKind, parent: types.Node | null = null) {
  return new types.Expression(createIdentifier(escapedText), kind, parent);
}

// 创建service声明
export function createServiceDeclaration(name: string, members: types.FunctionDeclaration[] = [], parent: types.Node | null = null) {
  return new types.ServiceDeclaration(createIdentifier(name), members, parent)
}

// 创建函数声明
export function createFunctionDeclaration(name: string, parameters: string, returns: string, parent: types.ServiceDeclaration) {
  return new types.FunctionDeclaration(createIdentifier(name), createIdentifier(parameters), createIdentifier(returns), parent)
}
