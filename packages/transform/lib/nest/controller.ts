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
  QualifiedName,
} from "typescript";

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
          factory.createImportSpecifier(undefined, factory.createIdentifier('Controller')),
          factory.createImportSpecifier(undefined, factory.createIdentifier('Get')),
          factory.createImportSpecifier(undefined, factory.createIdentifier('Post')),
          factory.createImportSpecifier(undefined, factory.createIdentifier('Put')),
          factory.createImportSpecifier(undefined, factory.createIdentifier('Delete')),
          factory.createImportSpecifier(undefined, factory.createIdentifier('Req'))
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
          factory.createImportSpecifier(
            undefined,
            factory.createIdentifier('ApiOperation')
          ),
          factory.createImportSpecifier(undefined, factory.createIdentifier('ApiTags'))
        ])
      ),
      factory.createStringLiteral('@nestjs/swagger')
    )
  ]

}
