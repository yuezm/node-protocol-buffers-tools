import { customCreateIdentifier, customCreateNumericLiteral, customCreatePropertyAccessExpression } from '../lib/util';
import { customTraverse } from '../lib/traverse'
import { CSyntaxKind, CIdentifier, CModule, CNode, CPropertyAccessExpression, CStringLiteral } from '../lib/parser';

describe('测试 helper/factory.ts', () => {
  test('测试 customCreateNumericLiteral', () => {
    const n = customCreateNumericLiteral('1');
    expect(n.text).toBe('1');
    expect(n.kind).toBe(CSyntaxKind.NumericLiteral);
    expect(n.parent).toBeNull();
  });

  test('测试 customCreateIdentifier', () => {
    const n = customCreateIdentifier('1');
    expect(n.escapedText).toBe('1');
    expect(n.kind).toBe(CSyntaxKind.Identifier);
    expect(n.parent).toBeNull();
  });

  test('测试 customCreatePropertyAccessExpression to be null', () => {
    expect(customCreatePropertyAccessExpression('test')).toBeNull();
  });

  test('测试 customCreatePropertyAccessExpression two access', () => {
    const node = customCreatePropertyAccessExpression('xx.yy');
    expect(node.name.escapedText).toBe('yy');
    expect((node.expression as CIdentifier).escapedText).toBe('xx');
  });

  test('测试 customCreatePropertyAccessExpression more access', () => {
    const node = customCreatePropertyAccessExpression('xx.yy.zz');
    expect(node.name.escapedText).toBe('zz');
    expect((node.expression as CPropertyAccessExpression).name.escapedText).toBe('yy');
    expect((((node.expression as CPropertyAccessExpression).expression) as CIdentifier).escapedText).toBe('xx');
  });


  test('测试 customTraverse 立刻返回', () => {
    const handler = jest.fn();
    const visitor = {
      visitor: {
        [CSyntaxKind.Identifier]() {
          handler();
        }
      }
    };

    expect(customTraverse(null, visitor)).toBe(null);
    expect(handler).toBeCalledTimes(0);

    const node = new CNode(CSyntaxKind.Identifier);
    node.visited = true;
    expect(customTraverse(node, visitor)).toBe(node);
    expect(handler).toBeCalledTimes(0);

    const notNode: any = {};
    expect(customTraverse(notNode, visitor)).toBe(notNode);
    expect(handler).toBeCalledTimes(0);
  });

  test('测试 customTraverse 无法匹配 visitor', () => {
    const handler = jest.fn();
    const visitor = {
      visitor: {
        [CSyntaxKind.Module]() {
          handler();
        }
      }
    };
    const node = new CIdentifier('x');
    customTraverse(node, visitor);

    expect(node.visited).toBeTruthy();
    expect(handler).toBeCalledTimes(0);
  });

  test('测试 customTraverse 普通节点', () => {
    const node = new CIdentifier('x');

    const handler = jest.fn();
    const visitor = {
      visitor: {
        [CSyntaxKind.Identifier]() {
          handler();
        }
      }
    };

    customTraverse(node, visitor);

    expect(node.visited).toBeTruthy();
    expect(handler).toBeCalledTimes(1);
  });

  test('测试 customTraverse 数组节点', () => {
    const node = new CModule();
    node.body = [
      new CIdentifier('x'),
      new CStringLiteral('y'),
      new CIdentifier('z'),
    ];

    const handler = jest.fn();
    const visitor = {
      visitor: {
        [CSyntaxKind.Identifier]() {
          handler();
        }
      }
    };

    customTraverse(node, visitor);

    expect(node.visited).toBeTruthy();
    expect(node.body[node.body.length - 1].visited).toBeTruthy();
    expect(handler).toBeCalledTimes(2);
  });
});

