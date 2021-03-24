import { CliOptions } from './lib/define';
import { Cli } from './lib/cli';

export function bootstrap(options: CliOptions): void {
  const cli = new Cli(options);
  cli.run();
  console.log(cli.modules);
}
