/**
 * 将自定义的 AST --> typescript AST，生成AST定义
 */

import * as types from 'Parser/lib/types';
import * as define from 'Parser/lib/define';

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
} from 'typescript'
import { transformTypeNode } from 'Transform/lib/helper';

/**
 * 将 factory定义的自身的AST转换为TS自身的AST
 * @param mods {types.Module}
 * @requires {ModuleDeclaration}
 */
export function transform(mods: types.CModule[]): Statement[] {
  const nodes: Statement[] = [];
  for (const mod of mods) {
    nodes.push(...transformModuleDeclaration(mod));
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
 * @param node {types.Module} 自定义的 Module AST
 */
function transformModuleDeclaration(node: types.CModule): Statement[] {
  const body: Statement[] = [];

  for (const cn of node.body) {
    if (cn.kind === define.CSyntaxKind.ServiceDeclaration || cn.kind === define.CSyntaxKind.MessageDeclaration) {
      body.push(transformInterfaceDeclaration(cn as (types.CServiceDeclaration | types.CMessageDeclaration)));
    } else if (cn.kind === define.CSyntaxKind.EnumDeclaration) {
      body.push(transformEnumDeclaration(cn as types.CEnumDeclaration));
    }
  }

  let finalBody = body;
  let pkg = '';
  // 双重namespace，例如 google.protobuf
  if (node.package.kind === define.CSyntaxKind.PropertyAccessExpression) {
    finalBody = [
      factory.createModuleDeclaration(
        undefined,
        [ factory.createModifier(SyntaxKind.ExportKeyword) ],
        factory.createIdentifier((node.package as types.CPropertyAccessExpression).name.escapedText),
        factory.createModuleBlock(body),
        NodeFlags.Namespace
      )
    ];
    pkg = (((node.package as types.CPropertyAccessExpression).expression) as types.CIdentifier).escapedText;
  } else {
    pkg = (node.package as types.CIdentifier).escapedText;
  }


  // 其实需要加入 rxjs 和 grpc
  return [
    factory.createModuleDeclaration(
      undefined,
      [ factory.createModifier(SyntaxKind.ExportKeyword) ],
      factory.createIdentifier(pkg),
      factory.createModuleBlock(finalBody),
      NodeFlags.Namespace
    )
  ];
}

/**
 * 此处将 service 和 message 转换为 interface
 * @param node
 */
function transformInterfaceDeclaration(node: types.CServiceDeclaration | types.CMessageDeclaration): InterfaceDeclaration {
  const fns = [];
  const props = [];

  for (const member of node.members) {
    if (member.kind === define.CSyntaxKind.FunctionDeclaration) {
      fns.push(transformFunctionSignature(member as types.CFunctionDeclaration));
    } else if (member.kind === define.CSyntaxKind.MessageElement) {
      props.push(transformPropertySignature(member as types.CMessageElement));
    } else {
      console.log('else kind', member);
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
function transformEnumDeclaration(node: types.CEnumDeclaration) {
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
function transformFunctionSignature(node: types.CFunctionDeclaration): MethodSignature {
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
function transformPropertySignature(node: types.CMessageElement): PropertySignature {
  const types: TypeNode[] = [
    transformTypeNode(node.type),
    // @ts-ignore
    factory.createNull()
  ];

  // protocol buffer的数字类型，在js中以long形式呈现
  if (node.type.flags === define.CNodeFlags.GoogleNumber) {
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
