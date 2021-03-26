import { CliOptions } from './lib/define';
import { Cli } from './lib/cli';
import { Module } from 'Parser'
import { transform } from 'Parser';

export function bootstrap(options: CliOptions): string {
  const cli = new Cli(options);
  cli.run();

  let fileStr = '';
  for (const mod of cli.modules) {
    fileStr += transform.generate(transform.transform(mod)) + '\n';
  }

  return fileStr;
}
