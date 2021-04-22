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
export function transformPropertyAccessExpression(node: types.CPropertyAccessExpression): QualifiedName {
  return factory.createQualifiedName(
    node.expression.kind === define.CSyntaxKind.Identifier ?
      factory.createIdentifier((node.expression as types.CIdentifier).escapedText) :
      transformPropertyAccessExpression(node.expression as types.CPropertyAccessExpression),
    factory.createIdentifier(node.name.escapedText)
  );
}

/**
 * 转换类型 基本类型、引用类型 {又分为 xx、xx.yy.zz}
 * @param n
 */
export function transformTypeNode(n: types.CTypeNode): TypeNode {
  if (n.kind === define.CSyntaxKind.TypeReference) {
    // xx
    const tNode = n as types.CTypeReferenceNode;
    if (tNode.expression.kind === define.CSyntaxKind.Identifier) {
      return factory.createTypeReferenceNode(factory.createIdentifier((tNode.expression as types.CIdentifier).escapedText), undefined);
    }
    // xx.yy 表达式
    return factory.createTypeReferenceNode(transformPropertyAccessExpression(tNode.expression as types.CPropertyAccessExpression), undefined);
  }

  // 基本类型
  let tsKind;
  switch (n.kind) {
    case define.CSyntaxKind.BooleanKeyWord:
      tsKind = SyntaxKind.BooleanKeyword;
      break;
    case define.CSyntaxKind.StringKeyWord:
      tsKind = SyntaxKind.StringKeyword;
      break;
    case define.CSyntaxKind.NumberKeyWord:
      tsKind = SyntaxKind.NumberKeyword;
      break;
  }
  return factory.createKeywordTypeNode(tsKind);
}


// 判断当前是否需要从其他文件引入模块，例如对于 Test.Type ==> import { Test } from "xx";
export function getTypeNodesImports(n: types.CTypeNode): { imp: boolean, text?: string } {
  if (n.kind === define.CSyntaxKind.TypeReference && (n as types.CTypeReferenceNode).expression.kind === define.CSyntaxKind.PropertyAccessExpression) {
    const exp = (n as types.CTypeReferenceNode).expression as types.CPropertyAccessExpression;
    return {
      imp: true,
      text: exp.namespace,
    }
  }
  return { imp: false }
}
