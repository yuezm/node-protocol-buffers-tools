import Parser from 'Parser/lib/parser';
import { createToken } from 'Tokenizer/lib/factory';
import { TokenType } from 'Tokenizer/lib/define';
import {
  CEnumDeclaration,
  CIdentifier,
  CImportExpression,
  CMessageDeclaration,
  CPropertyAccessExpression,
  CServiceDeclaration,
  CTypeReferenceNode
} from 'Parser/lib/types';
import { CSyntaxKind, GOOGLE_BASE_NUMBER_TYPES } from 'Parser/lib/define';
import { tokenize } from 'Tokenizer/index';
import { readFileSync } from "fs";
import { join } from "path";
import { parse } from 'Parser/index';

describe('测试 parser.ts', () => {
  test('测试  illegal to be null', () => {
    const parser = new Parser({ source: [], filename: 'test.proto' });
    expect(parser.illegal(null).message).toBe('UnknownError');
  });

  test('测试 illegal', () => {
    const token = createToken(TokenType.SYMBOL, '{', 1, 2);
    const parser = new Parser({ source: [], filename: 'test.proto' });
    const e = parser.illegal(token);
    expect(e.message).toBe(`illegal { in test.proto on line ${ token.line }, start ${ token.start }, end ${ token.end }`);
  });

  test('测试 next to be null', () => {
    const parser = new Parser({ source: [], filename: '' });
    expect(parser.next()).toBeNull();
  });

  test('测试 next', () => {
    const token = createToken(TokenType.KEYWORD, 'message', 0, 0);
    const parser = new Parser({ source: [ token ], filename: '' });

    const t = parser.next();

    expect(t.value).toBe(token.value);
    expect(parser.offset).toBe(1);
  });

  test('测试 now to be null', () => {
    const parser = new Parser({ source: [], filename: '' });
    expect(parser.now()).toBeNull();
  });

  test('测试 now', () => {
    const token = createToken(TokenType.KEYWORD, 'message', 0, 0);
    const parser = new Parser({ source: [ token ], filename: '' });

    const t = parser.now();

    expect(t.value).toBe(token.value);
    expect(parser.offset).toBe(0);
  });

  test('测试 prev to be null', () => {
    const parser = new Parser({ source: [], filename: '' });
    expect(parser.prev()).toBeNull();
  });

  test('测试 prev', () => {
    const token = createToken(TokenType.KEYWORD, 'message', 0, 0);
    const parser = new Parser({ source: [ token ], filename: '' });
    parser.next();
    const t = parser.prev();
    expect(t.value).toBe(token.value);
    expect(parser.offset).toBe(1);
  });

  test('测试 skip failed', () => {
    const token = createToken(TokenType.KEYWORD, 'message', 0, 0);
    const parser = new Parser({ source: [ token ], filename: '' });

    expect(parser.offset).toBe(0);
    parser.skip('syntax');
    expect(parser.offset).toBe(0);
  });

  test('测试 skip succeed', () => {
    const token = createToken(TokenType.KEYWORD, 'message', 0, 0);
    const parser = new Parser({ source: [ token ], filename: '' });

    expect(parser.offset).toBe(0);
    parser.skip('message');
    expect(parser.offset).toBe(1);
  });

  test('测试 skipRe failed', () => {
    const token = createToken(TokenType.KEYWORD, 'message', 0, 0);
    const parser = new Parser({ source: [ token ], filename: '' });

    expect(parser.offset).toBe(0);
    parser.skipRe(/syntax/);
    expect(parser.offset).toBe(0);
  });

  test('测试 skipRe succeed', () => {
    const token = createToken(TokenType.KEYWORD, 'message', 0, 0);
    const parser = new Parser({ source: [ token ], filename: '' });

    expect(parser.offset).toBe(0);
    parser.skipRe(/message/);
    expect(parser.offset).toBe(1);
  });

  test('测试 serializeNumber', () => {
    const parser = new Parser({ source: [], filename: '' });

    expect(parser.serializeNumber(createToken(TokenType.VARIABLE, 'inf', 0, 0))).toBe(global.Infinity);
    expect(parser.serializeNumber(createToken(TokenType.VARIABLE, '-inf', 0, 0))).toBe(-global.Infinity);
    expect(parser.serializeNumber(createToken(TokenType.VARIABLE, 'INF', 0, 0))).toBe(global.Infinity);
    expect(parser.serializeNumber(createToken(TokenType.VARIABLE, '-INF', 0, 0))).toBe(-global.Infinity);
    expect(parser.serializeNumber(createToken(TokenType.VARIABLE, 'Inf', 0, 0))).toBe(global.Infinity);
    expect(parser.serializeNumber(createToken(TokenType.VARIABLE, '-Inf', 0, 0))).toBe(-global.Infinity);

    expect(parser.serializeNumber(createToken(TokenType.VARIABLE, 'nan', 0, 0))).toBe(global.NaN);
    expect(parser.serializeNumber(createToken(TokenType.VARIABLE, 'NAN', 0, 0))).toBe(global.NaN);
    expect(parser.serializeNumber(createToken(TokenType.VARIABLE, 'Nan', 0, 0))).toBe(global.NaN);
    expect(parser.serializeNumber(createToken(TokenType.VARIABLE, 'NaN', 0, 0))).toBe(global.NaN);

    expect(parser.serializeNumber(createToken(TokenType.VARIABLE, '0', 0, 0))).toBe(0);
    expect(parser.serializeNumber(createToken(TokenType.VARIABLE, '+0', 0, 0))).toBe(0);
    expect(parser.serializeNumber(createToken(TokenType.VARIABLE, '-0', 0, 0))).toBe(0);

    expect(parser.serializeNumber(createToken(TokenType.VARIABLE, '1', 0, 0))).toBe(1);
    expect(parser.serializeNumber(createToken(TokenType.VARIABLE, '+1', 0, 0))).toBe(1);
    expect(parser.serializeNumber(createToken(TokenType.VARIABLE, '-1', 0, 0))).toBe(-1);

    expect(parser.serializeNumber(createToken(TokenType.VARIABLE, '0x1', 0, 0))).toBe(1);
    expect(parser.serializeNumber(createToken(TokenType.VARIABLE, '-0x1', 0, 0))).toBe(-1);

    expect(parser.serializeNumber(createToken(TokenType.VARIABLE, '01', 0, 0))).toBe(1);
    expect(parser.serializeNumber(createToken(TokenType.VARIABLE, '-01', 0, 0))).toBe(-1);

    parser.illegal = jest.fn(parser.illegal);
    try {
      parser.serializeNumber(createToken(TokenType.VARIABLE, 'abc', 0, 0));
    } catch (e) {
    }
    expect(parser.illegal).toBeCalled();
  });

  test('测试 parseNumber', () => {
    const parser = new Parser({ source: [], filename: '' });
    const node = parser.parseNumber(createToken(TokenType.VARIABLE, '1', 0, 0));
    expect(node.text).toBe('1');
    expect(node.kind).toBe(CSyntaxKind.NumericLiteral);
  });

  test('测试 parsePackage', () => {
    const tokens = tokenize(`package test`);
    const parser = new Parser({ source: tokens, filename: '' });

    parser.next();
    parser.parsePackage();
    expect(parser.offset).toBe(2);
    expect(parser.package).toBe('test');
  });

  test('测试 parsePackage package repeat', () => {
    const tokens = tokenize(`package test; package test1;`);
    const parser = new Parser({ source: tokens, filename: '' });

    parser.illegal = jest.fn(parser.illegal);

    parser.next();
    parser.parsePackage();
    parser.skip(';');

    parser.next();
    try {
      parser.parsePackage();
    } catch (e) {
    }
    expect(parser.illegal).toBeCalled();
  });

  test('测试 parsePackage name invalid', () => {
    const tokens = tokenize(`package $$$`);
    const parser = new Parser({ source: tokens, filename: '' });

    parser.illegal = jest.fn(parser.illegal);

    parser.next();
    try {
      parser.parsePackage();
    } catch (e) {
    }
    expect(parser.illegal).toBeCalled();
  });

  test('测试 parseImport', () => {
    const tokens = tokenize(`import "test.proto"`);
    const parser = new Parser({ source: tokens, filename: '' });

    parser.next();
    const node = parser.parseImport();
    const ide = (node as CImportExpression).expression as CIdentifier;
    expect(ide.escapedText).toBe('test.proto');
    expect(ide.kind).toBe(CSyntaxKind.Identifier);
    expect(parser.offset).toBe(4);
  });

  test('测试 parseSyntax', () => {
    const tokens = tokenize(`syntax = "proto3"`);
    const parser = new Parser({ source: tokens, filename: '' });

    parser.next();
    parser.parseSyntax();

    expect(parser.syntax).toBe('proto3');
    expect(parser.offset).toBe(5);
  });

  test('测试 parseService', () => {
    const tokens = tokenize(`service Test{}`);
    const parser = new Parser({ source: tokens, filename: '' });

    parser.next();
    const syt = parser.parseService();

    expect(syt.kind).toBe(CSyntaxKind.ServiceDeclaration);
    expect(syt.name.escapedText).toBe('Test');
    expect(Array.isArray(syt.members)).toBeTruthy();
    expect(parser.offset).toBe(3);
  });

  test('测试 parseMethod', () => {
    const tokens = tokenize(`service Test2{rpc Search(Test) returns(Test);\nrpc Search2(test.Test) returns(google.protobuf.Empty);\n}`);
    const parser = new Parser({ source: tokens, filename: '' });
    parser.package = 'test'; // 对于 Test 这样的 message，默认给出 ${package}.${message-name}

    parser.next();
    const service = parser.parseService();
    service.append = jest.fn(service.append);

    parser.next();
    const method1 = parser.parseMethod(service);
    parser.next();
    const method2 = parser.parseMethod(service);

    service.append(method1);
    service.append(method2);

    expect(service.kind).toBe(CSyntaxKind.ServiceDeclaration);
    expect(service.name.escapedText).toBe('Test2');
    expect(service.members.length).toBe(2);
    expect(service.append).toBeCalledTimes(2);

    const p1 = method1.parameters as CTypeReferenceNode;
    const r1 = method1.returns as CTypeReferenceNode;
    expect(method1.name.escapedText).toBe('Search');
    expect((p1.expression as CPropertyAccessExpression).name.escapedText).toBe('Test');
    expect(((p1.expression as CPropertyAccessExpression).expression as CIdentifier).escapedText).toBe('test');
    expect((r1.expression as CPropertyAccessExpression).name.escapedText).toBe('Test');
    expect(((r1.expression as CPropertyAccessExpression).expression as CIdentifier).escapedText).toBe('test');


    const p2 = method2.parameters as CTypeReferenceNode;
    const r2 = method2.returns as CTypeReferenceNode;
    expect(method2.name.escapedText).toBe('Search2');
    expect((p2.expression as CPropertyAccessExpression).name.escapedText).toBe('Test');
    expect(((p2.expression as CPropertyAccessExpression).expression as CIdentifier).escapedText).toBe('test');
    expect((r2.expression as CPropertyAccessExpression).name.escapedText).toBe('Empty');
    expect(((r2.expression as CPropertyAccessExpression).expression as CPropertyAccessExpression).name.escapedText).toBe('protobuf');
    expect((((r2.expression as CPropertyAccessExpression).expression as CPropertyAccessExpression).expression as CIdentifier).escapedText).toBe('google');
  });

  test('测试  parseMessage', () => {
    const tokens = tokenize(`message Test{}`);
    const parser = new Parser({ source: tokens, filename: '' });

    parser.next();
    const syt = parser.parseMessage();

    expect(syt.kind).toBe(CSyntaxKind.MessageDeclaration);
    expect(syt.name.escapedText).toBe('Test');
    expect(Array.isArray(syt.members)).toBeTruthy();
    expect(parser.offset).toBe(3);
  });

  test('测试 parseMessageElement', () => {
    const tokens = tokenize(`message Test2{ Test2_Type name = 1; \n test3.Type type = 2; \n google.protobuf.Int32Value cls = 3; }`);
    const parser = new Parser({ source: tokens, filename: '' });
    parser.package = 'test'; // 对于 Test 这样的 message，默认给出 ${package}.${message-name}

    parser.next();
    const message = parser.parseMessage();
    parser.next();
    const item1 = parser.parseMessageElement(message);
    parser.next();
    const item2 = parser.parseMessageElement(message);
    parser.next();
    const item3 = parser.parseMessageElement(message);

    message.append(item1);
    message.append(item2);
    message.append(item3);

    expect(message.kind).toBe(CSyntaxKind.MessageDeclaration);
    expect(message.name.escapedText).toBe('Test2');
    expect(message.members.length).toBe(3);


    const t1 = (item1.type as CTypeReferenceNode);
    expect(item1.name.escapedText).toBe('name');
    expect((t1.expression as CPropertyAccessExpression).name.escapedText).toBe('Test2_Type');
    expect(((t1.expression as CPropertyAccessExpression).expression as CIdentifier).escapedText).toBe('test');

    const t2 = (item2.type as CTypeReferenceNode);
    expect(item2.name.escapedText).toBe('type');
    expect((t2.expression as CPropertyAccessExpression).name.escapedText).toBe('Type');
    expect(((t2.expression as CPropertyAccessExpression).expression as CIdentifier).escapedText).toBe('test3');


    const t3 = (item3.type as CTypeReferenceNode);
    expect(item3.name.escapedText).toBe('cls');
    expect((t3.expression as CPropertyAccessExpression).name.escapedText).toBe('Int32Value');
    expect(((t3.expression as CPropertyAccessExpression).expression as CPropertyAccessExpression).name.escapedText).toBe('protobuf');
    expect((((t3.expression as CPropertyAccessExpression).expression as CPropertyAccessExpression).expression as CIdentifier).escapedText).toBe('google');
  });

  test('测试  parseTypeNode', () => {
    const parser = new Parser({ source: [], filename: '' });
    parser.package = 'test';

    expect(parser.parseTypeNode('string').kind).toBe(CSyntaxKind.StringKeyWord);
    expect(parser.parseTypeNode('bool').kind).toBe(CSyntaxKind.BooleanKeyWord);
    for (const v of GOOGLE_BASE_NUMBER_TYPES) {
      expect(parser.parseTypeNode(v).kind).toBe(CSyntaxKind.NumberKeyWord);
    }

    const syt1 = parser.parseTypeNode('xx.yy');
    const exp1 = (syt1 as CTypeReferenceNode).expression as CPropertyAccessExpression;
    expect(syt1.kind).toBe(CSyntaxKind.TypeReference);
    expect(exp1.name.escapedText).toBe('yy');
    expect((exp1.expression as CIdentifier).escapedText).toBe('xx');

    const syt2 = parser.parseTypeNode('Test');
    const exp2 = (syt2 as CTypeReferenceNode).expression as CPropertyAccessExpression;
    expect(syt2.kind).toBe(CSyntaxKind.TypeReference);
    expect(exp2.name.escapedText).toBe('Test');
    expect((exp2.expression as CIdentifier).escapedText).toBe('test');
  });


  test('测试 parseEnum', () => {
    const tokens = tokenize(`enum Test{}`);
    const parser = new Parser({ source: tokens, filename: '' });

    parser.next();
    const syt = parser.parseEnum();

    expect(syt.kind).toBe(CSyntaxKind.EnumDeclaration);
    expect(syt.name.escapedText).toBe('Test');
    expect(Array.isArray(syt.members)).toBeTruthy();
    expect(parser.offset).toBe(3);
  });

  test('测试 parseEnumElement', () => {
    const tokens = tokenize(`enum Test{ DEFAULT = 0; ONCE = 1; }`);
    const parser = new Parser({ source: tokens, filename: '' });

    parser.next();
    const enums = parser.parseEnum();
    parser.next();
    const item1 = parser.parseEnumElement(enums);
    parser.next();
    const item2 = parser.parseEnumElement(enums);

    enums.append(item1);
    enums.append(item2);

    expect(enums.kind).toBe(CSyntaxKind.EnumDeclaration);
    expect(enums.name.escapedText).toBe('Test');
    expect(enums.members.length).toBe(2);

    expect(item1.kind).toBe(CSyntaxKind.EnumElement);
    expect(item1.name.escapedText).toBe('DEFAULT');
    expect(item1.initializer.text).toBe('0');

    expect(item2.kind).toBe(CSyntaxKind.EnumElement);
    expect(item2.name.escapedText).toBe('ONCE');
    expect(item2.initializer.text).toBe('1');
  });
});


describe('测试 index.ts', () => {
  test('测试 parse', () => {
    const source = readFileSync(join(__dirname, '../../../test/protocol-buffers/test1.proto')).toString();
    const tokens = tokenize(source);
    const root = parse({ source: tokens, filename: 'test1.proto' });

    expect(root.syntax).toBe('proto3');
    expect((root.package as CIdentifier).escapedText).toBe('test');


    expect(root.kind).toBe(CSyntaxKind.Module);
    expect(root.body.length).toBe(8);

    expect(root.body[0].kind).toBe(CSyntaxKind.ImportExpression);
    expect(root.body[1].kind).toBe(CSyntaxKind.ImportExpression);
    expect(root.body[2].kind).toBe(CSyntaxKind.ImportExpression);
    expect(root.body[3].kind).toBe(CSyntaxKind.ImportExpression);

    expect(root.body[4].kind).toBe(CSyntaxKind.ServiceDeclaration);
    expect((root.body[4] as CServiceDeclaration).members.length).toBe(5);
    (root.body[4] as CServiceDeclaration).members.forEach(fn => {
      expect(fn.kind).toBe(CSyntaxKind.FunctionDeclaration);
    });


    expect(root.body[5].kind).toBe(CSyntaxKind.MessageDeclaration);
    expect((root.body[5] as CMessageDeclaration).members.length).toBe(8);
    (root.body[5] as CMessageDeclaration).members.forEach(fn => {
      expect(fn.kind).toBe(CSyntaxKind.MessageElement);
    });

    expect(root.body[6].kind).toBe(CSyntaxKind.MessageDeclaration);
    expect((root.body[6] as CMessageDeclaration).members.length).toBe(1);
    (root.body[6] as CMessageDeclaration).members.forEach(fn => {
      expect(fn.kind).toBe(CSyntaxKind.MessageElement);
    });

    expect(root.body[7].kind).toBe(CSyntaxKind.EnumDeclaration);
    expect((root.body[7] as CEnumDeclaration).members.length).toBe(1);
    (root.body[7] as CEnumDeclaration).members.forEach(fn => {
      expect(fn.kind).toBe(CSyntaxKind.EnumElement);
    });
  });
});
