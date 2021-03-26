import * as types from '../types';
import * as define from '../define';
import { GOOGLE_BASE_NUMBER_TYPES, Google_BASE_TYPES } from '../define';

import {
  createMethodSignature,
  createParameter,
  createPropertySignature,
  factory,
  InterfaceDeclaration,
  MethodSignature,
  ModuleDeclaration,
  NodeFlags,
  Statement,
  SyntaxKind,
  PropertySignature,
  TypeNode,
  ScriptTarget,
  createSourceFile,
  createPrinter,
  QualifiedName,
} from 'typescript'

/**
 * 将 factory定义的自身的AST转换为TS自身的AST
 * @param node {types.Module}
 * @requires {ModuleDeclaration}
 */
export function transform(node: types.Module): ModuleDeclaration {
  return transformModuleDeclaration(node);
}

/**
 * 将typescript代码转换为字符串
 * @param node {ModuleDeclaration}
 * @returns {string}
 */
export function generate(node: ModuleDeclaration): string {
  const file = factory.updateSourceFile(
    createSourceFile('ast.ts', '', ScriptTarget.Latest),
    [
      node
    ]
  );
  const printer = createPrinter();
  return printer.printFile(file);
}


/**
 * 转换 Module ==> Namespace
 * @param node {types.Module} 自定义的 Module AST
 */
function transformModuleDeclaration(node: types.Module): ModuleDeclaration {
  const body: Statement[] = [];
  for (const cn of node.body) {
    if (cn.kind === define.SyntaxKind.ServiceDeclaration || cn.kind === define.SyntaxKind.MessageDeclaration) {
      body.push(transformInterfaceDeclaration(cn as (types.ServiceDeclaration | types.MessageDeclaration)));
    } else if (cn.kind === define.SyntaxKind.EnumDeclaration) {
      body.push(transformEnumDeclaration(cn as types.EnumDeclaration));
    }
  }

  let finalBody = body;
  let pkg = '';
  // 双重namespace
  if (node.package.kind === define.SyntaxKind.PropertyAccessExpression) {
    finalBody = [
      factory.createModuleDeclaration(
        undefined,
        [ factory.createModifier(SyntaxKind.ExportKeyword) ],
        factory.createIdentifier((node.package as types.PropertyAccessExpression).name.escapedText),
        factory.createModuleBlock(body),
        NodeFlags.Namespace
      )
    ];
    pkg = (((node.package as types.PropertyAccessExpression).expression) as types.Identifier).escapedText;
  } else {
    pkg = (node.package as types.Identifier).escapedText;
  }

  return factory.createModuleDeclaration(
    undefined,
    [ factory.createModifier(SyntaxKind.ExportKeyword) ],
    factory.createIdentifier(pkg),
    factory.createModuleBlock(finalBody),
    NodeFlags.Namespace
  );
}

/**
 * 此处将 service 和 message 转换为 interface
 * @param node
 */
function transformInterfaceDeclaration(node: types.ServiceDeclaration | types.MessageDeclaration): InterfaceDeclaration {
  const fns = [];
  const props = [];

  for (const member of node.members) {
    if (member.kind === define.SyntaxKind.FunctionDeclaration) {
      fns.push(transformFunctionSignature(member as types.FunctionDeclaration));
    } else if (member.kind === define.SyntaxKind.MessageElement) {
      props.push(transformPropertySignature(member as types.MessageElement));
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
function transformEnumDeclaration(node: types.EnumDeclaration) {
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
function transformFunctionSignature(node: types.FunctionDeclaration): MethodSignature {
  return createMethodSignature(
    undefined,
    [
      createParameter(
        undefined,
        undefined,
        undefined,
        factory.createIdentifier('request'),
        factory.createToken(SyntaxKind.QuestionToken),
        factory.createTypeReferenceNode(factory.createIdentifier(node.parameters.escapedText), undefined),
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
        factory.createTypeReferenceNode(factory.createIdentifier(node.returns.escapedText), undefined),
      ]
    ),
    factory.createIdentifier(node.name.escapedText),
    undefined
  )
}


/**
 * 创建interface中的属性定义
 */
function transformPropertySignature(node: types.MessageElement): PropertySignature {
  let type: TypeNode[] = [];
  const nodeType = node.type;

  // 检查是否是独立的类型(xx)，还是嵌套的(xx.yy.zz)
  if (nodeType.kind === define.SyntaxKind.Identifier) {
    // 看下类型是基础类型还是引用类型
    const typeText = (nodeType as types.Identifier).escapedText;

    if (!Google_BASE_TYPES.has(typeText)) {
      // 引用类型
      type = [ factory.createTypeReferenceNode(factory.createIdentifier(typeText), undefined) ];
    } else {
      // Google基础类型
      if (GOOGLE_BASE_NUMBER_TYPES.has(typeText)) {
        // Google 特殊的数字类型（涉及到 Long）
        type = [
          factory.createKeywordTypeNode(SyntaxKind.NumberKeyword),
          factory.createTypeReferenceNode(factory.createIdentifier('Long'), undefined)
        ];
      } else if (typeText === 'string') {
        type = [ factory.createKeywordTypeNode(SyntaxKind.StringKeyword) ];
      } else if (typeText === 'bool') {
        type = [ factory.createKeywordTypeNode(SyntaxKind.BooleanKeyword) ];
      }
    }
  } else {
    // 进入了 xx.yy.zz
    type = [
      factory.createTypeReferenceNode(
        transformPropertyAccessExpression(node.type as types.PropertyAccessExpression),
        undefined
      ),
    ];
  }

  return createPropertySignature(
    undefined,
    factory.createIdentifier(node.name.escapedText),
    factory.createToken(SyntaxKind.QuestionToken),
    factory.createUnionTypeNode([
      ...type as any[],
      // @ts-ignore
      factory.createNull()
    ]),
    undefined
  )
}

/**
 * 类型转换，特殊处理 xx.yy.zz 
 * @param node
 */
function transformPropertyAccessExpression(node: types.PropertyAccessExpression): QualifiedName {
  return factory.createQualifiedName(
    node.expression.kind === define.SyntaxKind.Identifier ?
      factory.createIdentifier((node.expression as types.Identifier).escapedText) :
      transformPropertyAccessExpression(node.expression as types.PropertyAccessExpression),
    factory.createIdentifier(node.name.escapedText)
  );
}

