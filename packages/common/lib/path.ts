const SLASH_RE = /\//g;
import { parse } from 'path';

export function formatPath(filepath: string): string {
  filepath = filepath.replace(parse(filepath).ext, '');
  return filepath.replace(SLASH_RE, '_');
}
