import {
  createReturn, createParameter,
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
  Statement,
  ClassDeclaration,
  createConstructor,
} from "typescript";


export function transformController(): Statement[] {
  const imports = createHeaderImports();
  const cls = createClassDeclaration();

  return [
    ...imports,
    cls
  ]
}

/**
 *
 * @returns 通用首部引入
 */
function createHeaderImports(): ImportDeclaration[] {
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
          factory.createImportSpecifier(undefined, factory.createIdentifier('Req')),
          factory.createImportSpecifier(undefined, factory.createIdentifier('Body')),
          factory.createImportSpecifier(undefined, factory.createIdentifier('Query')),
          factory.createImportSpecifier(undefined, factory.createIdentifier('Param'))
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
    ),
    factory.createImportDeclaration(
      undefined,
      undefined,
      createImportClause(
        undefined,
        factory.createNamedImports([
          factory.createImportSpecifier(undefined, factory.createIdentifier('Request'))
        ])
      ),
      factory.createStringLiteral('express')
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
    )
  ]

}


function createClassDeclaration(): ClassDeclaration {
  return factory.createClassDeclaration(
    [
      factory.createDecorator(
        createCall(factory.createIdentifier('Controller'), undefined,
          [
            factory.createStringLiteral('v1/user')
          ])
      ),
      factory.createDecorator(
        createCall(factory.createIdentifier('ApiTags'), undefined, [
          factory.createStringLiteral('')
        ])
      )
    ],
    [ factory.createModifier(SyntaxKind.ExportKeyword) ],
    factory.createIdentifier('UserController'),
    undefined,
    undefined,
    [
      createConstructor(
        undefined,
        undefined,
        [ createParameter(
          undefined,
          [
            factory.createModifier(SyntaxKind.PrivateKeyword),
            factory.createModifier(SyntaxKind.ReadonlyKeyword)
          ],
          undefined,
          factory.createIdentifier('userService'),
          undefined,
          factory.createTypeReferenceNode(
            factory.createIdentifier('UserService'),
            undefined
          ),
          undefined
        )
        ],
        factory.createBlock([], true)
      ),

      // 增
      createMethod(
        [
          factory.createDecorator(
            createCall(factory.createIdentifier('Post'), undefined, [
              factory.createStringLiteral('/')
            ])
          ),
          factory.createDecorator(
            createCall(factory.createIdentifier('ApiOperation'), undefined, [
              createObjectLiteral(
                [
                  factory.createPropertyAssignment(
                    factory.createIdentifier('description'),
                    factory.createStringLiteral('')
                  )
                ],
                false
              )
            ])
          )
        ],
        undefined,
        undefined,
        factory.createIdentifier('create'),
        undefined,
        undefined,
        [
          createParameter(
            [
              factory.createDecorator(
                createCall(factory.createIdentifier('Req'), undefined, [])
              )
            ],
            undefined,
            undefined,
            factory.createIdentifier('req'),
            undefined,
            factory.createTypeReferenceNode(
              factory.createIdentifier('Request'),
              undefined
            ),
            undefined
          ),
          createParameter(
            [
              factory.createDecorator(
                createCall(factory.createIdentifier('Body'), undefined, [])
              )
            ],
            undefined,
            undefined,
            factory.createIdentifier('Body'),
            undefined,
            undefined,
            undefined
          )
        ],
        undefined,
        factory.createBlock([], true)
      ),


      // 删
      createMethod(
        [
          factory.createDecorator(
            createCall(factory.createIdentifier('Delete'), undefined, [
              factory.createStringLiteral('/:id')
            ])
          ),
          factory.createDecorator(
            createCall(factory.createIdentifier('ApiOperation'), undefined, [
              createObjectLiteral(
                [
                  factory.createPropertyAssignment(
                    factory.createIdentifier('description'),
                    factory.createStringLiteral('')
                  )
                ],
                false
              )
            ])
          )
        ],
        undefined,
        undefined,
        factory.createIdentifier('delete'),
        undefined,
        undefined,
        [
          createParameter(
            [
              factory.createDecorator(
                createCall(factory.createIdentifier('Req'), undefined, [])
              )
            ],
            undefined,
            undefined,
            factory.createIdentifier('req'),
            undefined,
            factory.createTypeReferenceNode(
              factory.createIdentifier('Request'),
              undefined
            ),
            undefined
          ),
          createParameter(
            [
              factory.createDecorator(
                createCall(factory.createIdentifier('Param'), undefined, [
                  factory.createStringLiteral('id')
                ])
              )
            ],
            undefined,
            undefined,
            factory.createIdentifier('id'),
            undefined,
            undefined,
            undefined
          )
        ],
        undefined,
        factory.createBlock([], true)
      ),

      // 改
      createMethod(
        [
          factory.createDecorator(
            createCall(factory.createIdentifier('Put'), undefined, [
              factory.createStringLiteral('/:id')
            ])
          ),
          factory.createDecorator(
            createCall(factory.createIdentifier('ApiOperation'), undefined, [
              createObjectLiteral(
                [
                  factory.createPropertyAssignment(
                    factory.createIdentifier('description'),
                    factory.createStringLiteral('')
                  )
                ],
                false
              )
            ])
          )
        ],
        undefined,
        undefined,
        factory.createIdentifier('modify'),
        undefined,
        undefined,
        [
          createParameter(
            [
              factory.createDecorator(
                createCall(factory.createIdentifier('Req'), undefined, [])
              )
            ],
            undefined,
            undefined,
            factory.createIdentifier('req'),
            undefined,
            factory.createTypeReferenceNode(
              factory.createIdentifier('Request'),
              undefined
            ),
            undefined
          ),
          createParameter(
            [
              factory.createDecorator(
                createCall(factory.createIdentifier('Param'), undefined, [
                  factory.createStringLiteral('id')
                ])
              )
            ],
            undefined,
            undefined,
            factory.createIdentifier('id'),
            undefined,
            undefined,
            undefined
          ),
          createParameter(
            [
              factory.createDecorator(
                createCall(factory.createIdentifier('Body'), undefined, [])
              )
            ],
            undefined,
            undefined,
            factory.createIdentifier('body'),
            undefined,
            undefined,
            undefined
          )
        ],
        undefined,
        factory.createBlock([], true)
      ),

      // 查
      createMethod(
        [
          factory.createDecorator(
            createCall(factory.createIdentifier('Get'), undefined, [
              factory.createStringLiteral('/')
            ])
          ),
          factory.createDecorator(
            createCall(factory.createIdentifier('ApiOperation'), undefined, [
              createObjectLiteral(
                [
                  factory.createPropertyAssignment(
                    factory.createIdentifier('description'),
                    factory.createStringLiteral('')
                  )
                ],
                false
              )
            ])
          )
        ],
        undefined,
        undefined,
        factory.createIdentifier('paginate'),
        undefined,
        undefined,
        [
          createParameter(
            [
              factory.createDecorator(
                createCall(factory.createIdentifier('Req'), undefined, [])
              )
            ],
            undefined,
            undefined,
            factory.createIdentifier('req'),
            undefined,
            factory.createTypeReferenceNode(
              factory.createIdentifier('Request'),
              undefined
            ),
            undefined
          ),
          createParameter(
            [
              factory.createDecorator(
                createCall(factory.createIdentifier('Query'), undefined, [])
              )
            ],
            undefined,
            undefined,
            factory.createIdentifier('query'),
            undefined,
            undefined,
            undefined
          )
        ],
        undefined,
        factory.createBlock([], true)
      ),

      // 查
      createMethod(
        [
          factory.createDecorator(
            createCall(factory.createIdentifier('Get'), undefined, [
              factory.createStringLiteral('/:id')
            ])
          ),
          factory.createDecorator(
            createCall(factory.createIdentifier('ApiOperation'), undefined, [
              createObjectLiteral(
                [
                  factory.createPropertyAssignment(
                    factory.createIdentifier('description'),
                    factory.createStringLiteral('')
                  )
                ],
                false
              )
            ])
          )
        ],
        undefined,
        undefined,
        factory.createIdentifier('show'),
        undefined,
        undefined,
        [ createParameter(
          [
            factory.createDecorator(
              createCall(factory.createIdentifier('Req'), undefined, [])
            )
          ],
          undefined,
          undefined,
          factory.createIdentifier('req'),
          undefined,
          factory.createTypeReferenceNode(
            factory.createIdentifier('Request'),
            undefined
          ),
          undefined
        ), createParameter(
          [
            factory.createDecorator(
              createCall(factory.createIdentifier('Param'), undefined, [
                factory.createStringLiteral('id')
              ])
            )
          ],
          undefined,
          undefined,
          factory.createIdentifier('id'),
          undefined,
          undefined,
          undefined
        )
        ],
        undefined,
        factory.createBlock([], true)
      )
    ]
  )


}