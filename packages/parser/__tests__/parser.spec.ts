import Parser from 'Parser/lib/parser';
import { createToken } from 'Tokenizer/lib/factory';
import { TokenType } from 'Tokenizer/lib/define';

describe('测试 parser.ts', () => {
  test('测试  illegal', () => {
    const parser = new Parser({ source: [], filename: 'test.proto' });
    expect(parser.illegal(null).message).toBe('UnknownError');

    const token = createToken(TokenType.SYMBOL, '{', 1, 2);
    const e = parser.illegal(token);
    expect(e.message).toBe(`illegal { in test.proto on line ${ token.line }, start ${ token.start }, end ${ token.end }`);
  });

  // it('测试 parse', function () {
  //   const syt = parse({
  //     source: tokenize(readFileSync(join(__dirname, '../../../test/protocol-buffers/test1.proto')).toString()),
  //     filename: '测试proto',
  //   });
  //
  //   expect(syt.filename).toBe('测试proto');
  //   expect(syt.syntax).toBe('proto3');
  //   expect(syt.package).toBe('test1');
  //   expect(syt.body.length).toBe(6);
  // });
});
