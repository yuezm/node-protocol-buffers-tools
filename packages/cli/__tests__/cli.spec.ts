'use strict';

import { join } from "path";
import { bootstrap } from '../index';

describe('测试 cli', () => {
  describe('测试 cli.ts', () => {
    test('测试 cli.start', () => {
      const rootPath = join(__dirname, '../../../test/protocol-buffers');
      const str = bootstrap({ entry: 'test1.proto', path: [ rootPath ] })
      console.log(str);
    });
  });
});
