'use strict';

import { join } from "path";
import { bootstrap } from '../index';


describe('测试 cli', () => {

  describe('测试 cli.ts', () => {


    test('测试 cli.start', () => {
      const rootPath = join(__dirname, '../../../test/protocol-buffers');

      bootstrap({ entry: join(rootPath, 'test1.proto'), path: [ rootPath ] });
    });
  });
});
