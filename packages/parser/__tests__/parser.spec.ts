import { parse } from '../index';
import { SyntaxKind } from '../lib/define';
import { tokenize } from 'tokenizer';
import { join } from 'path';
import { readFileSync } from 'fs';
import { traverse } from 'Parser/lib/helper/factory';

describe('测试 parser包', () => {

  describe('测试 helper.ts', () => {
  });

  describe('测试 parser.ts', () => {
    it('测试 parse', function () {
      const syt = parse({
        source: tokenize(readFileSync(join(__dirname, '../../../test/protocol-buffers/test1.proto')).toString()),
        filename: '测试proto',
      });

      expect(syt.filename).toBe('测试proto');
      expect(syt.syntax).toBe('proto3');
      expect(syt.package).toBe('test1');
      expect(syt.body.length).toBe(6);
    });
  });


  describe('测试 visitor.ts', () => {
    const syt = parse({
      source: tokenize(readFileSync(join(__dirname, '../../../test/protocol-buffers/test1.proto')).toString()),
      filename: '测试proto',
    });
    traverse(syt, {
      visitor: {
        [SyntaxKind.ImportExpression](node) {
          // console.log(node);
        }
      }
    });
    console.log((syt.body[5] as any).members[2].type)
    // transform(syt[0]);
  });
});
