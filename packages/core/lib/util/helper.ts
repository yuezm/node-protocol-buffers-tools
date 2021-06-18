import { CNode } from '../parser';

export function isObject(obj: any): boolean {
  return typeof obj === 'object' && obj !== null;
}


// 判断当前值是否为语法节点
export function isNode(val: unknown): boolean {
  return val instanceof CNode;
}

