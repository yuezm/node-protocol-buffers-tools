import { isObject, formatPath, isNode } from '../lib/util';
import { CIdentifier } from '../lib/parser';

describe('测试 common', () => {
  describe('测试 helper.ts', () => {
    test('测试 isObject', () => {
      expect(isObject(null)).toBeFalsy();
      expect(isObject(undefined)).toBeFalsy();
      expect(isObject('')).toBeFalsy();
      expect(isObject(1)).toBeFalsy();
      expect(isObject(false)).toBeFalsy();

      expect(isObject({})).toBeTruthy();
      expect(isObject([])).toBeTruthy();
      expect(isObject(/.*?/)).toBeTruthy();
      expect(new Date()).toBeTruthy();
    })

    test('测试 isNode', () => {
      expect(isNode(null)).toBeFalsy();
      expect(isNode(undefined)).toBeFalsy();
      expect(isNode({})).toBeFalsy();
      expect(isNode(new CIdentifier('x'))).toBeTruthy();
    });
  });


  describe('测试 path.ts', () => {
    test('测试 formatPath', () => {
      expect(formatPath('test.proto')).toBe('test');
      expect(formatPath('test')).toBe('test');
      expect(formatPath('xx/yy')).toBe('xx_yy');
      expect(formatPath('xx/yy/zz.txt')).toBe('xx_yy_zz');
    });
  });
});
