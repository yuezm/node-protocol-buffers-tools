import { CliOptions, CliResult } from './lib/define';
import { Cli } from './lib/cli';
import { generate } from '@node_pb_tool/core';
import { transform as statementTransform } from './lib/transform/statement';

export function bootstrap(options: CliOptions): CliResult {
  const cli = new Cli(options);
  cli.run();

  const stateStr = generate(statementTransform(cli.modules));
  // let nestStr: TransNestResult;

  // service的确定代码转换，只需要主文件
  // for (const mod of cli.modules) {
  //   if (mod.isMain) {
  //     nestStr = nestTransform(mod);
  //   }
  // }
  return {
    // ...nestStr,
    statement: stateStr,
  };
}
