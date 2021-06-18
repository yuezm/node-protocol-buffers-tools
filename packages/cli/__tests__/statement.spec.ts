import {
  transform,
  createHeaderImports,
  transformEnumDeclaration,
  transformFunctionSignature,
  transformInterfaceDeclaration,
  transformModuleDeclaration,
  transformPropertySignature
} from '../lib/transform';
import { CEnumDeclaration, CMessageDeclaration, CServiceDeclaration, generate, parse, tokenize } from '@node_pb_tool/core';
import { Identifier, QualifiedName, SyntaxKind, TypeReferenceNode, UnionTypeNode, ModuleBlock, ModuleDeclaration } from 'typescript';

describe('测试 statement/index.ts', () => {
  test('测试 createHeaderImports', () => {
    // 这是很简单的代码，直接测试下就好了
    expect(generate(createHeaderImports()).trim()).toBe(
      `import { Metadata } from "grpc";\nimport { Observable } from "rxjs";\nimport { Long } from "long";`
    )
  });

  test('测试 transformEnumDeclaration', () => {
    const enumNode = parse({ filename: '', source: tokenize(`enum Test{ DEFAULT = 0; ONCE = 1; }`) });
    const newEnumNode = transformEnumDeclaration(enumNode.body[0] as CEnumDeclaration);

    expect(newEnumNode.kind).toBe(SyntaxKind.EnumDeclaration);
    expect(newEnumNode.name.escapedText).toBe('Test');
    expect(newEnumNode.members.length).toBe(2);

    expect((newEnumNode.members[0].name as Identifier).escapedText).toBe('DEFAULT');
    expect((newEnumNode.members[0].initializer as any).text).toBe('0');

    expect((newEnumNode.members[1].name as Identifier).escapedText).toBe('ONCE');
    expect((newEnumNode.members[1].initializer as any).text).toBe('1');
  });

  test('测试 transformFunctionSignature', () => {
    const functionNode = parse({ filename: '', source: tokenize(`service TestService{ rpc Find(Test1) returns(Test2) }`) });
    const newFunctionNode = transformFunctionSignature((functionNode.body[0] as CServiceDeclaration).members[0]);


    expect(newFunctionNode.kind).toBe(SyntaxKind.MethodSignature);
    expect((newFunctionNode.name as Identifier).escapedText).toBe('Find');
    expect(newFunctionNode.parameters.length).toBe(2); // request + metadata

    expect((newFunctionNode.parameters[0].name as Identifier).escapedText).toBe('request');
    expect(((newFunctionNode.parameters[0].type as TypeReferenceNode).typeName as QualifiedName).right.escapedText).toBe('Test1');
    expect(newFunctionNode.parameters[0].questionToken).toBeDefined();

    expect((newFunctionNode.parameters[1].name as Identifier).escapedText).toBe('metadata');
    expect(((newFunctionNode.parameters[1].type as TypeReferenceNode).typeName as Identifier).escapedText).toBe('Metadata');
    const type = newFunctionNode.type as TypeReferenceNode

    expect(newFunctionNode.parameters[1].questionToken).toBeDefined();
    expect((type.typeName as Identifier).escapedText).toBe('Observable');
    expect(type.typeArguments.length).toBe(1);
    expect(((type.typeArguments[0] as TypeReferenceNode).typeName as QualifiedName).right.escapedText).toBe('Test2');
  });

  test('测试 transformPropertySignature normal type', () => {
    const messageNode = parse({ filename: '', source: tokenize(`message TestMessage { Test Name = 1 }`) });
    const newMessageNode = transformPropertySignature((messageNode.body[0] as CMessageDeclaration).members[0]);

    const types = (newMessageNode.type as UnionTypeNode).types;
    expect((newMessageNode.name as Identifier).escapedText).toBe('Name');
    expect(newMessageNode.questionToken).toBeDefined();
    expect(types.length).toBe(2);
    expect(((types[0] as TypeReferenceNode).typeName as QualifiedName).right.escapedText).toBe('Test');
    expect(types[1].kind).toBe(SyntaxKind.NullKeyword);
  });


  test('测试 transformPropertySignature google number type', () => {
    const messageNode = parse({ filename: '', source: tokenize(`message TestMessage { uint32 Age = 2; }`) });
    const newMessageNode = transformPropertySignature((messageNode.body[0] as CMessageDeclaration).members[0]);

    const types = (newMessageNode.type as UnionTypeNode).types;
    expect((newMessageNode.name as Identifier).escapedText).toBe('Age');
    expect(newMessageNode.questionToken).toBeDefined();
    expect(types.length).toBe(3);
    expect(((types[0] as TypeReferenceNode).typeName as Identifier).escapedText).toBe('Long');
    expect(types[1].kind).toBe(SyntaxKind.NumberKeyword);
    expect(types[2].kind).toBe(SyntaxKind.NullKeyword);
  });

  test('测试 transformInterfaceDeclaration with service', () => {
    const serviceNode = parse({ filename: '', source: tokenize(`service TestService{ rpc Find(Test1) returns(Test2) }`) });
    const newServiceNode = transformInterfaceDeclaration(serviceNode.body[0] as CServiceDeclaration);

    expect(newServiceNode.name.escapedText).toBe('TestService');
    expect(newServiceNode.members.length).toBe(1);
  });

  test('测试 transformInterfaceDeclaration with message', () => {
    const messageNode = parse({ filename: '', source: tokenize(`message TestMessage { Test Name = 1 }`) });
    const newMessageNode = transformInterfaceDeclaration(messageNode.body[0] as CMessageDeclaration);

    expect(newMessageNode.name.escapedText).toBe('TestMessage');
    expect(newMessageNode.members.length).toBe(1);
  });

  test('测试 transformInterfaceDeclaration with enum', () => {
    const messageNode = parse({ filename: '', source: tokenize(`enum TestEnum{}`) });
    const newMessageNode = transformInterfaceDeclaration(messageNode.body[0] as CEnumDeclaration);

    expect(newMessageNode.name.escapedText).toBe('TestEnum');
    expect(newMessageNode.members.length).toBe(0);
  });


  test('测试 transformModuleDeclaration simple package', () => {
    const sourceNode = parse({
      filename: '',
      source: tokenize(`package test;\n message TestMessage { Test Name = 1 }; \n service TestService{ rpc Find(Test1) returns(Test2) }`)
    });
    const newNode = transformModuleDeclaration(sourceNode);
    expect(newNode.kind).toBe(SyntaxKind.ModuleDeclaration);
    expect((newNode.name as Identifier).escapedText).toBe('test');
    expect((newNode.body as ModuleBlock).statements.length).toBe(2);
  });

  test('测试 transformModuleDeclaration hard package', () => {
    const sourceNode = parse({
      filename: '',
      source: tokenize(`package google.protobuf;\n
      message TestMessage { Test Name = 1 }; \n
      service TestService{ rpc Find(Test1) returns(Test2) };\n
      enum TestEnum {};`)
    });
    const newNode = transformModuleDeclaration(sourceNode);
    expect(newNode.kind).toBe(SyntaxKind.ModuleDeclaration);
    expect((newNode.name as Identifier).escapedText).toBe('google');
    expect((((newNode.body as ModuleBlock).statements[0] as ModuleDeclaration).name as Identifier).escapedText).toBe('protobuf');
  });

  test('测试 transform', () => {
    const sourceNode = parse({
      filename: '',
      source: tokenize(`package test;\n message TestMessage { Test Name = 1 }; \n service TestService{ rpc Find(Test1) returns(Test2) }`)
    });
    const newNode = transform([ sourceNode ]);
    expect(newNode.length).toBe(4);
  });
});
