import { readFileSync } from 'fs';
import { join } from 'path';

import Tokenizer from '../lib/tokenizer';
import { tokenize } from '../index';


describe('测试 token.ts', () => {
  it('测试 unescape', function () {
    expect(Tokenizer.unescape('\\')).toBe('');
    expect(Tokenizer.unescape('\"')).toBe('"');
    expect(Tokenizer.unescape('\n')).toBe('\n');
    expect(Tokenizer.unescape('\0')).toBe('\0');
    expect(Tokenizer.unescape('\r')).toBe('\r');
    expect(Tokenizer.unescape('\t')).toBe('\t');
  });

  it('测试 illegal', function () {
    const token = new Tokenizer('');
    const err = token.illegal('测试');

    expect(err instanceof Error).toBeTruthy();
    expect(err.message).toBe('illegal 测试 (line 1)')
  });

  it('测试 readString 单引号', function () {
    const source = `"Test","Test1"`;
    const token = new Tokenizer(source);

    token.stringDelimit = '"';
    expect(token.readString()).toBe('Test');
    expect(token.readString()).toBe(',');
    expect(token.readString()).toBe('Test1');
  });

  it('测试 readString 双引号', function () {
    const source = `'Test'`;
    const token = new Tokenizer(source);

    token.stringDelimit = '\'';
    expect(token.readString()).toBe('Test');
  });

  it('测试 push', function () {
    const t = new Tokenizer('');
    t.push('token');
    expect(t.stack[0]).toBe('token');
  });

  it('测试 charAt', function () {
    const t = new Tokenizer('abc');
    expect(t.charAt(0)).toBe('a');
    expect(t.charAt(1)).toBe('b');
    expect(t.charAt(2)).toBe('c');
  });

  it('测试 next', function () {
    const source = readFileSync(join(__dirname, '../../../test/protocol-buffers/test1.proto')).toString();
    const t = new Tokenizer(source);

    expect(t.next() === 'syntax');
    expect(t.next() === '=');
    expect(t.next() === '"');
  });
});

describe('测试 index.ts', () => {
  it('测试 tokenizer', function () {
    const source = readFileSync(join(__dirname, '../../../test/protocol-buffers/test1.proto')).toString();
    console.log(tokenize(source));
    expect(tokenize(source)).toBeDefined();
  });
});
