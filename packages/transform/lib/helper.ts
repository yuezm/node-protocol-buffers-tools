import * as types from 'Parser/lib/types';
import * as define from 'Parser/lib/define';

import {
  factory,
  SyntaxKind,
  TypeNode,
  QualifiedName,
} from 'typescript'

/**
 * 类型转换，特殊处理 xx.yy.zz
 * @param node
 */
export function transformPropertyAccessExpression(node: types.PropertyAccessExpression): QualifiedName {
  return factory.createQualifiedName(
    node.expression.kind === define.SyntaxKind.Identifier ?
      factory.createIdentifier((node.expression as types.Identifier).escapedText) :
      transformPropertyAccessExpression(node.expression as types.PropertyAccessExpression),
    factory.createIdentifier(node.name.escapedText)
  );
}

/**
 * 转换类型 基本类型、引用类型 {又分为 xx、xx.yy.zz}
 * @param n
 */
export function transformTypeNode(n: types.TypeNode): TypeNode {
  if (n.kind === define.SyntaxKind.TypeReference) {
    // xx
    const tNode = n as types.TypeReferenceNode;
    if (tNode.expression.kind === define.SyntaxKind.Identifier) {
      return factory.createTypeReferenceNode(factory.createIdentifier((tNode.expression as types.Identifier).escapedText), undefined);
    }
    // xx.yy 表达式
    return factory.createTypeReferenceNode(transformPropertyAccessExpression(tNode.expression as types.PropertyAccessExpression), undefined);
  }

  // 基本类型
  let tsKind;
  switch (n.kind) {
    case define.SyntaxKind.BooleanKeyWord:
      tsKind = SyntaxKind.BooleanKeyword;
      break;
    case define.SyntaxKind.StringKeyWord:
      tsKind = SyntaxKind.StringKeyword;
      break;
    case define.SyntaxKind.NumberKeyWord:
      tsKind = SyntaxKind.NumberKeyword;
      break;
  }
  return factory.createKeywordTypeNode(tsKind);
}


// 判断当前是否需要从其他文件引入模块，例如对于 Test.Type ==> import { Test } from "xx";
export function getTypeNodesImports(n: types.TypeNode): { imp: boolean, text?: string } {
  if (n.kind === define.SyntaxKind.TypeReference && (n as types.TypeReferenceNode).expression.kind === define.SyntaxKind.PropertyAccessExpression) {
    const exp = (n as types.TypeReferenceNode).expression as types.PropertyAccessExpression;
    return {
      imp: true,
      text: exp.namespace,
    }
  }
  return { imp: false }
}
