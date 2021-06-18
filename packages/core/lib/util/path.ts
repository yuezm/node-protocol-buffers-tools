import { parse } from 'path';

const SLASH_RE = /\//g; // 斜杠正则

/**
 * 对路径处理，将路径的斜杠转换为_
 */
export function formatPath(filepath: string): string {
  filepath = filepath.replace(parse(filepath).ext, '');
  return filepath.replace(SLASH_RE, '_');
}
