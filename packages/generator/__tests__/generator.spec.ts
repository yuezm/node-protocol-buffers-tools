import { createSourceFile, ScriptTarget } from 'typescript';
import { generate } from 'Generator/index';

describe('测试 generator', () => {
  test('测试 generate 单节点', () => {
    const sf = createSourceFile('test.ts', 'const a = 1', ScriptTarget.ESNext);
    expect(generate(sf.statements[0]).trim()).toBe('const a = 1;');
  });

  test('测试 generate 数组节点', () => {
    const sf = createSourceFile('test.ts', 'const a = 1;const b = 2;', ScriptTarget.ESNext);
    expect(generate(sf.statements as any).trim()).toBe(`const a = 1;\nconst b = 2;`)
  });
});
