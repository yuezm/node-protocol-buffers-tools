
import { createReturn, createParameter, createMethod, createBinary, createPropertyAccess, createProperty, createCall, createImportClause, factory, SyntaxKind, createObjectLiteral, Node, MethodDeclaration, PropertyDeclaration, ExpressionStatement, ImportDeclaration, QualifiedName, } from "typescript";
import * as types from "Parser/lib/types";
import * as define from 'Parser/lib/define';
import { TransformServiceOptions } from "../define";
import { transformPropertyAccessExpression } from "../statement";
import { getPropertyAccessOriginStr } from "Parser/lib/helper/helper";


export function transformService(mod: types.Module): Node[] {
  const importNodes: ImportDeclaration[] = [];
  const defNodes: PropertyDeclaration[] = [];
  const decNodes: PropertyDeclaration[] = [];
  const initNodes: ExpressionStatement[] = [];
  const membersNodes: MethodDeclaration[] = [];

  const importItems: string[] = [] // 其余无规则import的集合，例如 import { xx,yy } from "zz"; ==>  [ xx, yy ]

  importNodes.push(...createHeaderImports());

  const pkg = (mod.package as types.Identifier).escapedText;
  for (const node of mod.body) {
    if (node.kind === define.SyntaxKind.ServiceDeclaration) {
      const basename = (node as types.ServiceDeclaration).name.escapedText
      const { define, dec, init, members, imports } = createRpcService(node as types.ServiceDeclaration, {
        package: pkg,
        filename: mod.filename,
        filepath: mod.filepath,
        fileRelativePath: mod.fileRelativePath,
        serviceName: basename,
        serviceRpcName: `${basename}RpcService`,
      });

      defNodes.push(define);
      decNodes.push(dec);
      initNodes.push(init);
      membersNodes.push(...members);
      importItems.push(...imports)
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

  return [ ...importNodes, createMainClass(defNodes, decNodes, initNodes, membersNodes) ];
}

/**
 * 
 * @returns 通用首部引入
 */
export function createHeaderImports(): ImportDeclaration[] {
  return [
    factory.createImportDeclaration( // @nestjs/common
      undefined,
      undefined,
      createImportClause(
        undefined,
        factory.createNamedImports([
          factory.createImportSpecifier(undefined, factory.createIdentifier('Injectable'))
        ])
      ),
      factory.createStringLiteral('@nestjs/common')),

    factory.createImportDeclaration( // @nestjs/microservices
      undefined,
      undefined,
      createImportClause(
        undefined,
        factory.createNamedImports([
          factory.createImportSpecifier(undefined, factory.createIdentifier('Client')),
          factory.createImportSpecifier(undefined, factory.createIdentifier('ClientGrpc'))
        ])
      ),
      factory.createStringLiteral('@nestjs/microservices')
    ),

    factory.createImportDeclaration( // @Src/helper
      undefined,
      undefined,
      createImportClause(
        undefined,
        factory.createNamedImports([
          factory.createImportSpecifier(
            undefined,
            factory.createIdentifier('composeGRPCClientOption')
          )
        ])
      ),
      factory.createStringLiteral('@Src/helper')
    ),

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
  ]
}


export function createMainClass(
  def: PropertyDeclaration[],
  dec: PropertyDeclaration[],
  init: ExpressionStatement[],
  members: MethodDeclaration[]): any {
  return factory.createClassDeclaration(
    [
      factory.createDecorator(
        createCall(factory.createIdentifier('Injectable'), undefined, [])
      )
    ],
    [ factory.createModifier(SyntaxKind.ExportKeyword) ],
    factory.createIdentifier('UserService'),
    undefined,
    undefined,
    [
      // xxRpcService
      ...def,


      // @Client
      ...dec,


      // onModuleInit
      createMethod(
        undefined,
        undefined,
        undefined,
        factory.createIdentifier('onModuleInit'),
        undefined,
        undefined,
        [],
        undefined,
        factory.createBlock(
          [
            ...init,
          ],
          true
        )
      ),
      ...members,
    ]
  )
}

// 生成一个RPC Service，包含声明、装饰器、初始化
export function createRpcService(svc: types.ServiceDeclaration, options: TransformServiceOptions) {
  const clientName = `${options.serviceName}Client`;
  const imports = [ options.package ];  // 需要引入该 package

  // 声明
  const define = createProperty(
    undefined,
    [ factory.createModifier(SyntaxKind.PrivateKeyword) ],
    factory.createIdentifier(options.serviceRpcName),
    undefined,
    factory.createTypeReferenceNode(
      factory.createQualifiedName(factory.createIdentifier(options.package), factory.createIdentifier(options.serviceName)),
      undefined
    ),
    undefined
  );

  // 装饰器
  const dec = createProperty(
    [
      factory.createDecorator(
        createCall(factory.createIdentifier('Client'), undefined, [
          createCall(
            factory.createIdentifier('composeGRPCClientOption'),
            undefined,
            [
              createObjectLiteral(
                [
                  factory.createPropertyAssignment(factory.createIdentifier('url'), factory.createStringLiteral('$URL')),
                  // 填入 package 信息
                  factory.createPropertyAssignment(factory.createIdentifier('package'), factory.createStringLiteral(options.package)),
                  // protoPath 路径
                  factory.createPropertyAssignment(factory.createIdentifier('protoPath'), factory.createStringLiteral(options.filename))
                ],
                false
              )
            ]
          )
        ])
      )
    ],
    [
      factory.createModifier(SyntaxKind.PrivateKeyword),
      factory.createModifier(SyntaxKind.ReadonlyKeyword)
    ],
    factory.createIdentifier(clientName),
    undefined,
    factory.createTypeReferenceNode(factory.createIdentifier('ClientGrpc'), undefined),
    undefined
  );

  // onModuleInit 内初始化
  const init = factory.createExpressionStatement(
    createBinary(
      createPropertyAccess(factory.createThis(), factory.createIdentifier(options.serviceRpcName)),
      factory.createToken(SyntaxKind.FirstAssignment),
      createCall(
        createPropertyAccess(
          createPropertyAccess(factory.createThis(), factory.createIdentifier(clientName)),
          factory.createIdentifier('getService')
        ),
        [
          factory.createTypeReferenceNode(
            factory.createQualifiedName(factory.createIdentifier(options.package), factory.createIdentifier(options.serviceName)),
            undefined
          )
        ],
        [ factory.createStringLiteral(options.serviceName) ]
      )
    )
  );


  // 写入service，内部方法
  const members: MethodDeclaration[] = [];
  for (const fn of svc.members) {
    members.push(createRpcMethod(fn, options, imports));
  }

  return {
    define,
    dec,
    init,
    members,
    imports,
  };
}

export function createRpcMethod(med: types.FunctionDeclaration, options: TransformServiceOptions, imports: string[]): MethodDeclaration {
  let parametersSyt: QualifiedName;
  let returnsSyt: QualifiedName;

  // 参数序列化
  if (med.parameters.kind === define.SyntaxKind.Identifier) {
    parametersSyt = factory.createQualifiedName(
      factory.createIdentifier(options.package),
      factory.createIdentifier((med.parameters as types.Identifier).escapedText)
    );
  } else {
    parametersSyt = transformPropertyAccessExpression(med.parameters as types.PropertyAccessExpression);
    // 看是否需要额外的导入
    const originStr = getPropertyAccessOriginStr(med.parameters as types.PropertyAccessExpression);
    imports.push(originStr[ 0 ]); // 需要将首个字符加载进来

    console.log(originStr);

  }

  // 返回值序列化
  if (med.returns.kind === define.SyntaxKind.Identifier) {
    returnsSyt = factory.createQualifiedName(
      factory.createIdentifier(options.package),
      factory.createIdentifier((med.returns as types.Identifier).escapedText)
    );
  } else {
    returnsSyt = transformPropertyAccessExpression(med.returns as types.PropertyAccessExpression);
    // 看是否需要额外的导入
    const originStr = getPropertyAccessOriginStr(med.returns as types.PropertyAccessExpression);
    imports.push(originStr[ 0 ]); // 需要将首个字符加载进来
  }


  return createMethod(
    undefined,
    undefined,
    undefined,
    factory.createIdentifier(med.name.escapedText),
    undefined,
    undefined,
    [
      // 函数参数
      createParameter(
        undefined,
        undefined,
        undefined,
        factory.createIdentifier('request'),
        undefined,
        factory.createTypeReferenceNode(parametersSyt, undefined),
        undefined
      ),

      // 函数固定参数 metadata
      createParameter(
        undefined,
        undefined,
        undefined,
        factory.createIdentifier('metadata'),
        undefined,
        factory.createTypeReferenceNode(factory.createIdentifier('Metadata'), undefined),
        undefined
      ),
    ],

    // 函数参数返回值定义
    factory.createTypeReferenceNode(
      factory.createIdentifier('Observable'),
      [
        factory.createTypeReferenceNode(returnsSyt, undefined)
      ]),


    // 函数代码实体
    factory.createBlock(
      [
        createReturn(
          createCall(
            createPropertyAccess(
              createPropertyAccess(factory.createThis(), factory.createIdentifier(options.serviceRpcName)),
              factory.createIdentifier(med.name.escapedText)
            ),
            undefined,
            [
              factory.createIdentifier('request'),
              factory.createIdentifier('metadata')
            ]
          )
        )
      ],
      true
    )
  )
}
