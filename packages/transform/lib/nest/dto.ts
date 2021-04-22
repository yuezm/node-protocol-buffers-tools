import {
  createPropertyAccess,
  createProperty,
  createCall,
  createImportClause,
  factory,
  SyntaxKind,
  createObjectLiteral,
  PropertyDeclaration,
  ImportDeclaration,
  Statement,
  ClassDeclaration,
  ClassElement,
} from "typescript";

import * as types from 'Parser/lib/types';
import * as define from 'Parser/lib/define';
import { getTypeNodesImports, transformTypeNode } from 'Transform/lib/helper';
import { TransformDtoOptions } from 'Transform/lib/define';


/**
 * 转换 DTO，关于DTO的话，只转换 message 定义
 * @param mod
 * @returns
 */
export function transformDto(mod: types.CModule): Statement[] {
  const classes: Statement[] = [];
  const importNodes = createHeaderImports();
  const importItems: string[] = [];

  const options: TransformDtoOptions = {
    package: (mod.package as types.CIdentifier).escapedText,
    enumSet: new Set<string>(mod.enums),
    messageSet: new Set<string>(mod.messages),
  };

  for (const cn of mod.body) {
    if (cn.kind === define.CSyntaxKind.MessageDeclaration) {
      classes.push(
        transformMessage(
          cn as types.CMessageDeclaration,
          importItems,
          options,
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
    factory.createStringLiteral(`@Protocol/${mod.filename}`)
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

export function transformMessage(msg: types.CMessageDeclaration, imports: string[], options: TransformDtoOptions): ClassDeclaration {
  const body: ClassElement[] = [];

  for (const item of msg.members) {
    body.push(transformMessageItem(item, imports, options));
  }


  return factory.createClassDeclaration(
    undefined,
    [ factory.createModifier(SyntaxKind.ExportKeyword) ],
    factory.createIdentifier(`${msg.name.escapedText}Dto`),
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

export function transformMessageItem(itm: types.CMessageElement, imports: string[], options: TransformDtoOptions): ClassElement {
  if (itm.type.kind === define.CSyntaxKind.StringKeyWord) {
    return createPropertyString(itm);
  } else if (itm.type.kind === define.CSyntaxKind.NumberKeyWord) {
    return createPropertyNumber(itm);
  } else if (itm.type.kind === define.CSyntaxKind.BooleanKeyWord) {
    return createPropertyBoolean(itm);
  } else {
    return createRefProperty(itm, imports, options);
  }
}

export function createPropertyString(itm: types.CMessageElement): PropertyDeclaration {
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

export function createPropertyNumber(itm: types.CMessageElement): PropertyDeclaration {
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

export function createPropertyBoolean(itm: types.CMessageElement): PropertyDeclaration {
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

/**
 * 转换 message 内部的引用数据类型
 * @param itm
 * @param imports
 * @param options
 * @returns
 */
export function createRefProperty(itm: types.CMessageElement, imports: string[], options: TransformDtoOptions): PropertyDeclaration {
  const type = itm.type as types.CTypeReferenceNode;
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

  if (type.expression.kind === define.CSyntaxKind.PropertyAccessExpression && (type.expression as types.CPropertyAccessExpression).namespace === options.package) {
    // 加一个Type转换
    const text = (type.expression as types.CPropertyAccessExpression).name.escapedText;
    const transformType = options.enumSet.has(text) ? 'Number' : `${text}Dto`;

    decorators.push(
      factory.createDecorator(createCall(factory.createIdentifier('Type'), undefined, [
        factory.createArrowFunction(
          undefined,
          undefined,
          [],
          undefined,
          factory.createToken(SyntaxKind.EqualsGreaterThanToken),
          factory.createIdentifier(transformType)
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
