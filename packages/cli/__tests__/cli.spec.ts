'use strict';

import { join } from "path";
import { bootstrap } from '../index';
import { transform } from 'Parser';
import { generate } from "Parser/lib/helper/transform";


describe('测试 cli', () => {

  describe('测试 cli.ts', () => {


    test('测试 cli.start', () => {
      const rootPath = join(__dirname, '../../../test/protocol-buffers');
      const str = bootstrap({ entry: join(rootPath, 'test1.proto'), path: [ rootPath ] })
      console.log(str);
    });
  });
});
