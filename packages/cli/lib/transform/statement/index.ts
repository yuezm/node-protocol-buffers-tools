/**
 * 将自定义的 AST --> typescript AST，生成AST定义，此处仅仅是定义，而非实际的代码
 */

import {
  CEnumDeclaration,
  CFunctionDeclaration,
  CIdentifier,
  CMessageDeclaration,
  CMessageElement,
  CModule,
  CNodeFlags,
  CPropertyAccessExpression,
  CServiceDeclaration,
  CSyntaxKind
} from '@node_pb_tool/core';
import {
  createMethodSignature,
  createParameter,
  createPropertySignature,
  createImportClause,
  factory,
  InterfaceDeclaration,
  MethodSignature,
  NodeFlags,
  Statement,
  SyntaxKind,
  PropertySignature,
  TypeNode,
  ImportDeclaration,
  EnumDeclaration,
  ModuleDeclaration,
} from 'typescript'
import { transformTypeNode } from '../../util/helper';

/**
 * 将 factory定义的自身的AST转换为TS自身的AST
 * @param mods {Module}
 * @requires {ModuleDeclaration}
 */
export function transform(mods: CModule[]): Statement[] {
  const nodes: Statement[] = [];
  for (const mod of mods) {
    nodes.push(transformModuleDeclaration(mod));
  }
  nodes.unshift(...createHeaderImports());
  return nodes;
}


/**
 *
 * @returns 通用首部引入
 */
export function createHeaderImports(): ImportDeclaration[] {
  return [
    factory.createImportDeclaration( // grpc
      undefined,
      undefined,
      createImportClause(
        undefined,
        factory.createNamedImports([
          factory.createImportSpecifier(undefined, factory.createIdentifier('Metadata'))
        ])
      ),
      factory.createStringLiteral('grpc')
    ),

    factory.createImportDeclaration( // Observable
      undefined,
      undefined,
      createImportClause(
        undefined,
        factory.createNamedImports([
          factory.createImportSpecifier(undefined, factory.createIdentifier('Observable'))
        ])
      ),
      factory.createStringLiteral('rxjs')
    ),

    factory.createImportDeclaration( // long
      undefined,
      undefined,
      createImportClause(
        undefined,
        factory.createNamedImports([
          factory.createImportSpecifier(undefined, factory.createIdentifier('Long'))
        ])
      ),
      factory.createStringLiteral('long')
    ),
  ]
}

/**
 * 转换 Module ==> Namespace
 * @param node {Module} 自定义的 Module AST
 */
export function transformModuleDeclaration(node: CModule): ModuleDeclaration {
  const body: Statement[] = [];

  for (const cn of node.body) {
    if (cn.kind === CSyntaxKind.ServiceDeclaration || cn.kind === CSyntaxKind.MessageDeclaration) {
      body.push(transformInterfaceDeclaration(cn as (CServiceDeclaration | CMessageDeclaration)));
    } else if (cn.kind === CSyntaxKind.EnumDeclaration) {
      body.push(transformEnumDeclaration(cn as CEnumDeclaration));
    }
  }

  let finalBody = body;
  let pkg = '';
  // 双重namespace，例如 google.protobuf
  if (node.package.kind === CSyntaxKind.PropertyAccessExpression) {
    finalBody = [
      factory.createModuleDeclaration(
        undefined,
        [ factory.createModifier(SyntaxKind.ExportKeyword) ],
        factory.createIdentifier((node.package as CPropertyAccessExpression).name.escapedText),
        factory.createModuleBlock(body),
        NodeFlags.Namespace
      )
    ];
    pkg = (((node.package as CPropertyAccessExpression).expression) as CIdentifier).escapedText;
  } else {
    pkg = (node.package as CIdentifier).escapedText;
  }

  return factory.createModuleDeclaration(
    undefined,
    [ factory.createModifier(SyntaxKind.ExportKeyword) ],
    factory.createIdentifier(pkg),
    factory.createModuleBlock(finalBody),
    NodeFlags.Namespace
  )
}

/**
 * 此处将 service 和 message 转换为 interface
 * @param node
 */
export function transformInterfaceDeclaration(node: CServiceDeclaration | CMessageDeclaration): InterfaceDeclaration {
  const fns = [];
  const props = [];

  for (const member of node.members) {
    if (member.kind === CSyntaxKind.FunctionDeclaration) {
      fns.push(transformFunctionSignature(member as CFunctionDeclaration));
    } else if (member.kind === CSyntaxKind.MessageElement) {
      props.push(transformPropertySignature(member as CMessageElement));
    }
  }

  return factory.createInterfaceDeclaration(
    undefined,
    [ factory.createModifier(SyntaxKind.ExportKeyword) ],
    factory.createIdentifier(node.name.escapedText),
    undefined,
    undefined,
    [ ...props, ...fns ]
  );
}

/**
 * 枚举转换
 * @param node
 */
export function transformEnumDeclaration(node: CEnumDeclaration): EnumDeclaration {
  const body = [];
  for (const member of node.members) {
    body.push(factory.createEnumMember(
      factory.createIdentifier(member.name.escapedText),
      factory.createNumericLiteral(member.initializer.text)
    ));
  }
  return factory.createEnumDeclaration(undefined, [ factory.createModifier(SyntaxKind.ExportKeyword) ], factory.createIdentifier(node.name.escapedText), body)
}


/**
 * 创建 interface 中的函数定义
 * @param node
 */
export function transformFunctionSignature(node: CFunctionDeclaration): MethodSignature {
  return createMethodSignature(
    undefined,
    [
      createParameter(
        undefined,
        undefined,
        undefined,
        factory.createIdentifier('request'),
        factory.createToken(SyntaxKind.QuestionToken),
        transformTypeNode(node.parameters),
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
    factory.createTypeReferenceNode(
      factory.createIdentifier('Observable'),
      [
        transformTypeNode(node.returns),
      ]
    ),
    factory.createIdentifier(node.name.escapedText),
    undefined
  )
}


/**
 * 创建interface中的属性定义
 */
export function transformPropertySignature(node: CMessageElement): PropertySignature {
  const types: (TypeNode | any)[] = [
    transformTypeNode(node.type),
    factory.createNull()
  ];

  // protocol buffer的数字类型，在js中以long形式呈现
  if (node.type.flags === CNodeFlags.GoogleNumber) {
    types.unshift(factory.createTypeReferenceNode(factory.createIdentifier('Long')));
  }

  return createPropertySignature(
    undefined,
    factory.createIdentifier(node.name.escapedText),
    factory.createToken(SyntaxKind.QuestionToken),
    factory.createUnionTypeNode(types),
    undefined
  );
}
