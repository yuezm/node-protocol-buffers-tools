import { CliOptions } from './lib/define';
import { Cli } from './lib/cli';
import { generate } from 'Generator/';
import { transform as statementTransform } from 'Transform/lib/statement';
import { transform as nestTransform } from "Transform/lib/nest";

export function bootstrap(options: CliOptions): string {
  const cli = new Cli(options);
  cli.run();

  const stateStr = generate(statementTransform(cli.modules));
  let nestStr = '';

  // service的确定代码转换，只需要主文件
  for (const mod of cli.modules) {
    if (mod.isMain) {
      nestStr += generate(nestTransform(mod)) + '\n';
    }
  }
  return stateStr + '\n' + nestStr;
}
