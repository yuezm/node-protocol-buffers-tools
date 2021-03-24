import * as types from '../types';
import * as define from '../define';

import {
  factory,
  Node,
  ModuleDeclaration,
  NodeFlags,
  SyntaxKind,
  Statement,
  MethodSignature,
  EnumMember,
  createMethodSignature,
  createParameter,
  createTypeReferenceNode,
  createPropertySignature,
  createNull
} from 'typescript'


export function transform(node: types.Module): Node {
  const mod: ModuleDeclaration = factory.createModuleDeclaration(
    undefined,
    [ factory.createModifier(SyntaxKind.ExportKeyword) ],
    factory.createIdentifier(node.package),
    factory.createModuleBlock([]),
    NodeFlags.Namespace
  );


  return mod;
}


export function generate() {

}


export function createNamespace(name: string, body: Statement[]): ModuleDeclaration {
  return factory.createModuleDeclaration(
    undefined,
    [ factory.createModifier(SyntaxKind.ExportKeyword) ],
    factory.createIdentifier(name),
    factory.createModuleBlock(body),
    NodeFlags.Namespace
  )
}

export function createInterface(name: string, body: MethodSignature[]) {
  return factory.createInterfaceDeclaration(
    undefined,
    undefined,
    factory.createIdentifier('A'),
    undefined,
    undefined,
    body
  );
}

export function createFunction(name: string, request: string, response: string) {
  return createMethodSignature(
    undefined,
    [
      createParameter(
        undefined,
        undefined,
        undefined,
        factory.createIdentifier('request'),
        factory.createToken(SyntaxKind.QuestionToken),
        factory.createTypeReferenceNode(factory.createIdentifier(request), undefined),
        undefined
      ),
      createParameter(
        undefined,
        undefined,
        undefined,
        factory.createIdentifier('metadata'),
        factory.createToken(SyntaxKind.QuestionToken),
        factory.createTypeReferenceNode(factory.createIdentifier('Metadata'), undefined),
        undefined
      )
    ],
    factory.createTypeReferenceNode(factory.createIdentifier(response), undefined),
    factory.createIdentifier(name),
    undefined
  )
}

export function createParams() {
  return createPropertySignature(
    undefined,
    factory.createIdentifier('storeId'),
    factory.createToken(SyntaxKind.QuestionToken),
    factory.createParenthesizedType(
      factory.createUnionTypeNode([
        factory.createKeywordTypeNode(SyntaxKind.NumberKeyword),
        factory.createTypeReferenceNode(factory.createIdentifier('Long'), undefined),
        createNull()
      ])
    ),
    undefined
  )
}

export function createEnum(name: string, body: EnumMember[]) {
  return factory.createEnumDeclaration(undefined, undefined, factory.createIdentifier(name), body)
}

export function createEnumElement(key: string, value: string) {
  return factory.createEnumMember(
    factory.createIdentifier(key),
    factory.createNumericLiteral(value)
  )
}

function createNull(): import("typescript").TypeNode {
  throw new Error('Function not implemented.');
}

