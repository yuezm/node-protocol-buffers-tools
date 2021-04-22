import { readFileSync } from 'fs';
import { join } from 'path';

import Tokenizer from '../lib/tokenizer';
import { tokenize } from '../index';
import { createToken } from 'Tokenizer/lib/factory';
import { TokenType } from 'Tokenizer/lib/define';


describe('测试 token.ts', () => {
  test('测试 unescape', function () {
    expect(Tokenizer.unescape('\\')).toBe('');
    expect(Tokenizer.unescape('\"')).toBe('"');
    expect(Tokenizer.unescape('\n')).toBe('\n');
    expect(Tokenizer.unescape('\0')).toBe('\0');
    expect(Tokenizer.unescape('\r')).toBe('\r');
    expect(Tokenizer.unescape('\t')).toBe('\t');
  });

  test('测试 illegal', function () {
    const token = new Tokenizer('');
    const err = token.illegal('测试');

    expect(err instanceof Error).toBeTruthy();
    expect(err.message).toBe('illegal 测试 (line 1)')
  });

  test('测试 linePlus', () => {
    const t = new Tokenizer('');

    expect(t.line).toBe(1);
    expect(t.lineOffset).toBe(1);

    t.linePlus();

    expect(t.line).toBe(2);
    expect(t.lineOffset).toBe(0);
  });

  test('测试 offsetPlus', () => {
    const t = new Tokenizer('');
    expect(t.offset).toBe(0);
    expect(t.lineOffset).toBe(1);

    t.offsetPlus();

    expect(t.offset).toBe(1);
    expect(t.lineOffset).toBe(2);
  });

  test('测试 setOffsetValue', () => {
    const t = new Tokenizer('');
    expect(t.offset).toBe(0);
    expect(t.lineOffset).toBe(1);

    t.setOffsetValue(1);

    expect(t.offset).toBe(1);
    expect(t.lineOffset).toBe(2);
  });

  test('测试 readString 双引号', function () {
    const source = `"Test"`;
    const token = new Tokenizer(source);

    token.next();
    expect(token.readString()).toBe('Test');
  });

  test('测试 readString 单引号', function () {
    const source = `'Test'`;
    const token = new Tokenizer(source);

    token.next();
    expect(token.readString()).toBe('Test');
  });

  test('测试 readString 同时存在单引号和双引号', () => {

    const source = `"Test"\n'Test1'`;
    const token = new Tokenizer(source);

    token.next();
    expect(token.readString()).toBe('Test');
    token.next();
    token.next();
    expect(token.readString()).toBe('Test1');
  });

  test('测试 push', function () {
    const t = new Tokenizer('');
    t.push('token');
    expect(t.stack[0]).toBe('token');
  });

  test('测试 charAt', function () {
    const t = new Tokenizer('abc');
    expect(t.charAt(0)).toBe('a');
    expect(t.charAt(1)).toBe('b');
    expect(t.charAt(2)).toBe('c');
  });

  test('测试 setComment 单行注释', () => {
    const token = new Tokenizer(`//我是注释1\n//我是注释2`);
    expect(token.setComment(0, 16, false)).toBe([ '我是注释1', '我是注释2' ].join('\n'));
  });

  test('测试 setComment 块级注释', () => {
    const token = new Tokenizer(`/* 我是注释1 */`);
    expect(token.setComment(0, 9, false)).toBe([ '我是注释1' ].join('\n'));
  });

  test('测试 setComment 同时包含双斜线和块级注释', () => {
    const token = new Tokenizer(`//我是注释1\n/* 我是注释2\n*/`);
    expect(token.setComment(0, 7, false)).toBe([ '我是注释1' ].join('\n'));
    expect(token.setComment(7, 18, false)).toBe([ '我是注释2' ].join('\n'));
  });

  test('测试 findEndOfLine 换行符', () => {
    const token = new Tokenizer(`end of line\n`);
    expect(token.findEndOfLine(0)).toBe(11);
  });

  test('测试 findEndOfLine 结束行', () => {
    const token = new Tokenizer(`end of line2`);
    expect(token.findEndOfLine(0)).toBe(12);
  });

  test('测试 isDoubleSlashCommentLine to be true', () => {
    const token = new Tokenizer(`\/\/ 单行注释\n`);
    expect(token.isDoubleSlashCommentLine(0)).toBeTruthy();
  });

  test('测试 isDoubleSlashCommentLine to be false', () => {
    const token = new Tokenizer(`\* 单行注释 */\n`);
    expect(token.isDoubleSlashCommentLine(0)).toBeFalsy();
  });

  test('测试 next 块级注释、单行注释、字符串、普通字符...', function () {
    const source = readFileSync(join(__dirname, '../../../test/protocol-buffers/comment.proto')).toString();
    const t = new Tokenizer(source, true);

    expect(t.next()).toBe('syntax');
    expect(t.line).toBe(1);
    expect(t.offset).toBe(6);
    expect(t.lineOffset).toBe(7);

    expect(t.next()).toBe('=');
    expect(t.next()).toBe('"');
    expect(t.next()).toBe('proto3');

    expect(t.next()).toBe('"');
    expect(t.next()).toBe(';');

    expect(t.next()).toBe('message');
    expect(t.line).toBe(7);
    expect(t.commentText).toBe('12345');


    while (t.next()) {
    }

    expect(t.commentText).toBe([ '1', '2', '3', '4' ].join('\n'));
    expect(t.line).toBe(15);
  });

  test('测试 next 字符串、普通字符...', () => {
    const t = new Tokenizer(`\/\/注释\nimport "test2.proto";\nmessage M {}`, false);

    expect(t.next()).toBe('import');
    expect(t.line).toBe(2);
    expect(t.offset).toBe(11);
    expect(t.lineOffset).toBe(6);

    expect(t.next()).toBe('"');
    expect(t.next()).toBe('test2.proto');
    expect(t.next()).toBe('"');
    expect(t.next()).toBe(';');

    while (t.next()) {
    }

    expect(t.line).toBe(3);
  });
});

describe('测试 factory.ts', () => {
  test('测试 createToken', () => {
    const token = createToken(TokenType.VARIABLE, 'message', 1, 8);

    expect(token.start).toBe(1);
    expect(token.end).toBe(7);
    expect(token.line).toBe(1);
    expect(token.value).toBe('message');
    expect(token.type).toBe(TokenType.VARIABLE);
  });
});

describe('测试 index.ts', () => {
  test('测试 tokenizer', function () {
    const source = readFileSync(join(__dirname, '../../../test/protocol-buffers/test1.proto')).toString();
    const tokens = tokenize(source);

    expect(Array.isArray(tokens)).toBeTruthy();

    const firstToken = tokens[0];

    expect(firstToken.type).toBe(TokenType.KEYWORD);
    expect(firstToken.start).toBe(1);
    expect(firstToken.end).toBe(6);
    expect(firstToken.line).toBe(1);

    const lastToken = tokens[tokens.length - 1];

    expect(lastToken.type).toBe(TokenType.SYMBOL);
    expect(lastToken.start).toBe(1);
    expect(lastToken.end).toBe(1);
    expect(lastToken.line).toBe(34);
  });
});
