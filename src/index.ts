import { cac } from "cac";

const cli = cac();

cli.command("run", "啟動").action(main);
cli.help();

cli.parse(process.argv, { run: false });
if (!cli.matchedCommand) {
  cli.outputHelp();
  process.exit(0);
}

try {
  await cli.runMatchedCommand();
} catch (error) {
  console.error(error);
  process.exit(1);
}

async function main() {
  console.log("Hello World");
}
