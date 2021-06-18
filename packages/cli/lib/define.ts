import { TransNestResult } from 'packages/cli/lib/transform/define';

export interface CliOptions {
  readonly entry: string, // 入口文件
  readonly path: string[], // protocol-buffer 的根文件路径，查找时，需按照该路径下进行搜索
}


export interface CliResult extends TransNestResult {
  statement?: string;
}
