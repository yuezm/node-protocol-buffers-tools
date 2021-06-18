import { customCreateIdentifier, customCreatePropertyAccessExpression, CKeyWordTypeNode, CTypeReferenceNode, CSyntaxKind } from '@node_pb_tool/core';
import { getTypeNodesImports, transformPropertyAccessExpression, transformTypeNode } from '../lib/util';
import { Identifier, QualifiedName, SyntaxKind, TypeReferenceNode } from 'typescript';

describe('测试 helper.ts', () => {
  test('测试 transformPropertyAccessExpression 单属性获取', () => {
    const oldNode = customCreatePropertyAccessExpression('xx.yy');
    const newNode = transformPropertyAccessExpression(oldNode);

    expect(newNode.kind).toBe(SyntaxKind.QualifiedName);
    expect(newNode.right.escapedText).toBe('yy');
    expect((newNode.left as Identifier).escapedText).toBe('xx');
  });

  test('测试 transformPropertyAccessExpression 多属性获取', () => {
    const oldNode = customCreatePropertyAccessExpression('xx.yy.zz');
    const newNode = transformPropertyAccessExpression(oldNode);

    const left = newNode.left as QualifiedName;
    expect(newNode.kind).toBe(SyntaxKind.QualifiedName);
    expect(newNode.right.escapedText).toBe('zz');
    expect(left.right.escapedText).toBe('yy');
    expect((left.left as Identifier).escapedText).toBe('xx');
  });

  test('测试 transformTypeNode 普通引用类型', () => {
    const oldNode = new CTypeReferenceNode(customCreateIdentifier('Test'));
    const newNode: TypeReferenceNode = transformTypeNode(oldNode) as TypeReferenceNode;
    expect((newNode.typeName as Identifier).escapedText).toBe('Test');
  });

  test('测试 transformTypeNode 复杂引用类型', () => {
    const oldNode = new CTypeReferenceNode(customCreatePropertyAccessExpression('test.Test'));
    const newNode: TypeReferenceNode = transformTypeNode(oldNode) as TypeReferenceNode;

    expect((newNode.typeName as QualifiedName).right.escapedText).toBe('Test');
    expect(((newNode.typeName as QualifiedName).left as Identifier).escapedText).toBe('test');
  });

  test('测试 transformTypeNode 基本类型', () => {
    expect(transformTypeNode(new CKeyWordTypeNode(CSyntaxKind.NumberKeyWord)).kind).toBe(SyntaxKind.NumberKeyword);
    expect(transformTypeNode(new CKeyWordTypeNode(CSyntaxKind.StringKeyWord)).kind).toBe(SyntaxKind.StringKeyword);
    expect(transformTypeNode(new CKeyWordTypeNode(CSyntaxKind.BooleanKeyWord)).kind).toBe(SyntaxKind.BooleanKeyword);
  });

  test('测试 getTypeNodesImports', () => {
    expect(getTypeNodesImports(new CKeyWordTypeNode(CSyntaxKind.BooleanKeyWord))).toEqual({ imp: false });
    expect(getTypeNodesImports(new CTypeReferenceNode(customCreateIdentifier('test')))).toEqual({ imp: false });

    expect(getTypeNodesImports(new CTypeReferenceNode(customCreatePropertyAccessExpression('xx.yy')))).toEqual({ imp: true, text: 'xx' });
    expect(getTypeNodesImports(new CTypeReferenceNode(customCreatePropertyAccessExpression('xx.yy.zz')))).toEqual({ imp: true, text: 'xx' });
  });

});
