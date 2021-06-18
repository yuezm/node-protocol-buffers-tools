import { factory, SyntaxKind, TypeNode, QualifiedName } from 'typescript'
import { CIdentifier, CPropertyAccessExpression, CSyntaxKind, CTypeNode, CTypeReferenceNode } from '@node_pb_tool/core';


/**
 * xx.yy.zz 的类型转换 CPropertyAccessExpression ==> QualifiedName
 * @param node
 */
export function transformPropertyAccessExpression(node: CPropertyAccessExpression): QualifiedName {
  return factory.createQualifiedName(
    node.expression.kind === CSyntaxKind.Identifier ?
      factory.createIdentifier((node.expression as CIdentifier).escapedText) :
      transformPropertyAccessExpression(node.expression as CPropertyAccessExpression),
    factory.createIdentifier(node.name.escapedText)
  );
}

/**
 * 转换类型 CTypeNode ==> TypeNode
 * @param n
 */
export function transformTypeNode(n: CTypeNode): TypeNode {
  if (n.kind === CSyntaxKind.TypeReference) {
    // xx
    const tNode = n as CTypeReferenceNode;
    if (tNode.expression.kind === CSyntaxKind.Identifier) {
      return factory.createTypeReferenceNode(factory.createIdentifier((tNode.expression as CIdentifier).escapedText), undefined);
    }
    // xx.yy 表达式
    return factory.createTypeReferenceNode(transformPropertyAccessExpression(tNode.expression as CPropertyAccessExpression), undefined);
  }

  // 基本类型
  let tsKind;
  switch (n.kind) {
    case CSyntaxKind.BooleanKeyWord:
      tsKind = SyntaxKind.BooleanKeyword;
      break;
    case CSyntaxKind.StringKeyWord:
      tsKind = SyntaxKind.StringKeyword;
      break;
    case CSyntaxKind.NumberKeyWord:
      tsKind = SyntaxKind.NumberKeyword;
      break;
  }
  return factory.createKeywordTypeNode(tsKind);
}


// 判断当前是否需要从其他文件引入模块，例如对于 test.Type ==> import { test } from "xx";
export function getTypeNodesImports(n: CTypeNode): { imp: boolean, text?: string } {
  if (n.kind === CSyntaxKind.TypeReference && (n as CTypeReferenceNode).expression.kind === CSyntaxKind.PropertyAccessExpression) {
    const exp = (n as CTypeReferenceNode).expression as CPropertyAccessExpression;
    return {
      imp: true,
      text: exp.namespace,
    }
  }
  return { imp: false }
}
