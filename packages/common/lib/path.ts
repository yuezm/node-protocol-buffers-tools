const SLASH_RE = /\//g;

export function formatPath(filepath: string): string {
  if (filepath.endsWith('.proto')) {
    filepath = filepath.replace('.proto', '');
  }
  return filepath.replace(SLASH_RE, '_');
}
