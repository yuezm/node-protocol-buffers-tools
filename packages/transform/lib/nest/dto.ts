import {
  createReturn,
  createParameter,
  createMethod,
  createBinary,
  createPropertyAccess,
  createProperty,
  createCall,
  createImportClause,
  factory,
  SyntaxKind,
  createObjectLiteral,
  Node,
  MethodDeclaration,
  PropertyDeclaration,
  ExpressionStatement,
  ImportDeclaration,
  Statement,
  ClassDeclaration,
  ClassElement,
} from "typescript";

import * as types from 'Parser/lib/types';
import * as define from 'Parser/lib/define';
import { getTypeNodesImports, transformTypeNode } from 'Transform/lib/helper';
import { TransformOptions } from 'Transform/lib/define';

export function transformDto(mod: types.Module): Statement[] {
  const classes: Statement[] = [];
  const importNodes = createHeaderImports();
  const importItems: string[] = [];

  for (const cn of mod.body) {
    if (cn.kind === define.SyntaxKind.MessageDeclaration) {
      classes.push(
        transformMessage(
          cn as types.MessageDeclaration,
          importItems,
          { package: (mod.package as types.Identifier).escapedText }
        )
      );
    }
  }

  importNodes.push(factory.createImportDeclaration( // Observable
    undefined,
    undefined,
    createImportClause(
      undefined,
      factory.createNamedImports(
        [ ...new Set(importItems) ].map(v => factory.createImportSpecifier(undefined, factory.createIdentifier(v)))
      )
    ),
    factory.createStringLiteral(`@Protocol/${ mod.filename }`)
  ));

  return [
    ...importNodes,
    ...classes,
  ]
}

/**
 *
 * @returns 通用首部引入
 */
export function createHeaderImports(): ImportDeclaration[] {
  return [
    factory.createImportDeclaration(
      undefined,
      undefined,
      createImportClause(
        undefined,
        factory.createNamedImports([
          factory.createImportSpecifier(undefined, factory.createIdentifier('ApiProperty')),
          factory.createImportSpecifier(
            undefined,
            factory.createIdentifier('ApiPropertyOptional')
          )
        ])
      ),
      factory.createStringLiteral('@nestjs/swagger')
    ),
    factory.createImportDeclaration(
      undefined,
      undefined,
      createImportClause(
        undefined,
        factory.createNamedImports([
          factory.createImportSpecifier(undefined, factory.createIdentifier('Expose')),
          factory.createImportSpecifier(undefined, factory.createIdentifier('Transform')),
          factory.createImportSpecifier(undefined, factory.createIdentifier('Type'))
        ])
      ),
      factory.createStringLiteral('class-transformer')
    ),
    factory.createImportDeclaration(
      undefined,
      undefined,
      createImportClause(
        undefined,
        factory.createNamedImports([
          factory.createImportSpecifier(undefined, factory.createIdentifier('IsEnum')),
          factory.createImportSpecifier(undefined, factory.createIdentifier('IsInt')),
          factory.createImportSpecifier(undefined, factory.createIdentifier('IsOptional'))
        ])
      ),
      factory.createStringLiteral('class-validator')
    )
  ]
}

export function transformMessage(msg: types.MessageDeclaration, imports: string[], options: TransformOptions): ClassDeclaration {
  const body: ClassElement[] = [];

  for (const item of msg.members) {
    body.push(transformMessageItem(item, imports));
  }


  return factory.createClassDeclaration(
    undefined,
    [ factory.createModifier(SyntaxKind.ExportKeyword) ],
    factory.createIdentifier(`${ msg.name.escapedText }Dto`),
    undefined,
    [
      factory.createHeritageClause(
        SyntaxKind.FirstFutureReservedWord,
        [
          factory.createExpressionWithTypeArguments(
            // factory.createIdentifier(msg.name.escapedText),
            createPropertyAccess(
              factory.createIdentifier(options.package),
              factory.createIdentifier(msg.name.escapedText)
            ),
            undefined
          )
        ]
      )
    ],
    body,
  )
}

export function transformMessageItem(itm: types.MessageElement, imports: string[]): ClassElement {
  if (itm.type.kind === define.SyntaxKind.StringKeyWord) {
    return createPropertyString(itm);
  } else if (itm.type.kind === define.SyntaxKind.NumberKeyWord) {
    return createPropertyNumber(itm);
  } else if (itm.type.kind === define.SyntaxKind.BooleanKeyWord) {
    return createPropertyBoolean(itm);
  } else {
    return createRefProperty(itm, imports);
  }
}

export function createPropertyString(itm: types.MessageElement): PropertyDeclaration {
  return createProperty(
    [
      factory.createDecorator(
        createCall(factory.createIdentifier('ApiPropertyOptional'),
          undefined,
          [ createObjectLiteral([ factory.createPropertyAssignment(factory.createIdentifier('description'), factory.createStringLiteral('')) ],
            false)
          ]
        )
      ),
      factory.createDecorator(createCall(factory.createIdentifier('Expose'), undefined, [])),
    ],
    undefined,
    factory.createIdentifier(itm.name.escapedText),
    factory.createToken(SyntaxKind.QuestionToken),
    factory.createKeywordTypeNode(SyntaxKind.StringKeyword),
    undefined
  )
}

export function createPropertyNumber(itm: types.MessageElement): PropertyDeclaration {
  return createProperty(
    [
      factory.createDecorator(
        createCall(factory.createIdentifier('ApiPropertyOptional'),
          undefined,
          [ createObjectLiteral([ factory.createPropertyAssignment(factory.createIdentifier('description'), factory.createStringLiteral('')) ],
            false)
          ]
        )
      ),
      factory.createDecorator(createCall(factory.createIdentifier('Expose'), undefined, [])),
      factory.createDecorator(createCall(factory.createIdentifier('Type'), undefined, [
          factory.createArrowFunction(
            undefined,
            undefined,
            [],
            undefined,
            factory.createToken(SyntaxKind.EqualsGreaterThanToken),
            factory.createIdentifier('Number')
          )
        ])
      )
    ],
    undefined,
    factory.createIdentifier(itm.name.escapedText),
    factory.createToken(SyntaxKind.QuestionToken),
    factory.createKeywordTypeNode(SyntaxKind.NumberKeyword),
    undefined
  )
}

export function createPropertyBoolean(itm: types.MessageElement): PropertyDeclaration {
  return createProperty(
    [
      factory.createDecorator(
        createCall(factory.createIdentifier('ApiPropertyOptional'),
          undefined,
          [ createObjectLiteral([ factory.createPropertyAssignment(factory.createIdentifier('description'), factory.createStringLiteral('')) ],
            false)
          ]
        )
      ),
      factory.createDecorator(createCall(factory.createIdentifier('Expose'), undefined, [])),
    ],
    undefined,
    factory.createIdentifier(itm.name.escapedText),
    factory.createToken(SyntaxKind.QuestionToken),
    factory.createKeywordTypeNode(SyntaxKind.BooleanKeyword),
    undefined
  );
}

export function createRefProperty(itm: types.MessageElement, imports: string[]): PropertyDeclaration {
  const type = itm.type as types.TypeReferenceNode;
  const typeNode = transformTypeNode(type);

  // 类型引入
  const typeImports = getTypeNodesImports(type);
  if (typeImports.imp) imports.push(typeImports.text);

  const decorators = [
    factory.createDecorator(
      createCall(factory.createIdentifier('ApiPropertyOptional'),
        undefined,
        [ createObjectLiteral([ factory.createPropertyAssignment(factory.createIdentifier('description'), factory.createStringLiteral('')) ],
          false)
        ]
      )
    ),
    factory.createDecorator(createCall(factory.createIdentifier('Expose'), undefined, [])),
  ];

  if (type.expression.kind === define.SyntaxKind.Identifier) {
    // 加一个Type转换
    decorators.push(
      factory.createDecorator(createCall(factory.createIdentifier('Type'), undefined, [
          factory.createArrowFunction(
            undefined,
            undefined,
            [],
            undefined,
            factory.createToken(SyntaxKind.EqualsGreaterThanToken),
            factory.createIdentifier(`${ (type.expression as types.Identifier).escapedText }Dto`)
          )
        ])
      )
    )
  }

  return createProperty(
    decorators,
    undefined,
    factory.createIdentifier(itm.name.escapedText),
    undefined,
    typeNode,
    undefined
  );
}
