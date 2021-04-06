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
  createArrayLiteral,
} from "typescript";

export default function transformModule(): Statement {
  return factory.createClassDeclaration(
    [
      factory.createDecorator(
        createCall(factory.createIdentifier('Module'), undefined, [
          createObjectLiteral(
            [
              factory.createPropertyAssignment(
                factory.createIdentifier('controllers'),
                createArrayLiteral(
                  [ factory.createIdentifier('UserController') ],
                  false
                )
              ),
              factory.createPropertyAssignment(
                factory.createIdentifier('providers'),
                createArrayLiteral(
                  [ factory.createIdentifier('UserService') ],
                  false
                )
              ),
              factory.createPropertyAssignment(
                factory.createIdentifier('exports'),
                createArrayLiteral(
                  [ factory.createIdentifier('UserService') ],
                  false
                )
              )
            ],
            false
          )
        ])
      )
    ],
    [ factory.createModifier(SyntaxKind.ExportKeyword) ],
    factory.createIdentifier('UserModule'),
    undefined,
    undefined,
    []
  );
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
          factory.createImportSpecifier(undefined, factory.createIdentifier('Module'))
        ])
      ),
      factory.createStringLiteral('@nestjs/common')
    ),

    factory.createImportDeclaration(
      undefined,
      undefined,
      createImportClause(
        undefined,
        factory.createNamedImports([
          factory.createImportSpecifier(undefined, factory.createIdentifier('UserService'))
        ])
      ),
      factory.createStringLiteral('./user.service')
    ),
    factory.createImportDeclaration(
      undefined,
      undefined,
      createImportClause(
        undefined,
        factory.createNamedImports([
          factory.createImportSpecifier(
            undefined,
            factory.createIdentifier('UserController')
          )
        ])
      ),
      factory.createStringLiteral('./user.controller')
    )
  ]
}