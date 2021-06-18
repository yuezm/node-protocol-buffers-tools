'use strict';

import { join } from "path";
import { bootstrap } from '../index';
import { Cli } from "../lib/cli";

describe('测试 lib/cli.ts', () => {
  test('测试 run', () => {
    const rootPath = join(__dirname, '../../../test/protocol-buffers');
    const cli = new Cli({ entry: 'test2.proto', path: [ rootPath ] });

    cli.parseByPath = jest.fn(cli.parseByPath);
    cli.parseImport = jest.fn(cli.parseImport);
    cli.run();

    expect(cli.parseByPath).toBeCalledTimes(2);
    expect(cli.parseImport).toBeCalledTimes(2);
    expect(cli.modules.length).toBe(2);
    expect(cli.modules[0].isMain).toBeFalsy();
    expect(cli.modules[1].isMain).toBeTruthy();
  });

  test('测试 parseByPath 及 parseImport', () => {
    const rootPath = join(__dirname, '../../../test/protocol-buffers');
    const cli = new Cli({ entry: 'test1.proto', path: [ rootPath ] });

    cli.parseByPath = jest.fn(cli.parseByPath);
    cli.parseImport = jest.fn(cli.parseImport);
    cli.run();

    expect(cli.parseByPath).toBeCalledTimes(6);
    expect(cli.parseImport).toBeCalledTimes(6);
    expect(cli.modules.length).toBe(4);


    console.log(cli.modules)

    expect(cli.modules[0].isMain).toBeTruthy();
    expect(cli.modules[0].body.length).toBe(9);
    expect(cli.modules[1].isMain).toBeFalsy();
    expect(cli.modules[1].isMain).toBeFalsy();
  });

  test('测试 serializeFilePath', () => {
    const rootPath = join(__dirname, '../../../test/protocol-buffers');
    const cli = new Cli({ entry: 'test1.proto', path: [ rootPath ] });

    cli.serializeFilePath = jest.fn(cli.serializeFilePath);

    expect(cli.serializeFilePath('google/protobuf/empty.proto')).toBe(join(__dirname, '../../../google/protobuf/empty.proto'));
    expect(cli.serializeFilePath(join(rootPath, 'test1.proto'))).toBe(join(rootPath, 'test1.proto'))
    expect(cli.serializeFilePath('test1.proto')).toBe(join(rootPath, 'test1.proto'))

    try {
      cli.serializeFilePath('test4.proto')
    } catch (error) {
      expect(cli.serializeFilePath).toThrowError();
    }
  });
});


describe('测试 index.ts', () => {
  test('测试 cli.start', () => {
    const rootPath = join(__dirname, '../../../test/protocol-buffers');
    const str = bootstrap({ entry: 'test1.proto', path: [ rootPath ] })
    console.log(str);
  });
});
