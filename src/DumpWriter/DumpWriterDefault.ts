import { format } from "date-fns";
import { stringify } from "yaml";

import type { Logger } from "~shared/Logger";
import { YamlFile } from "~shared/utils/YamlFile";

import type { DumpWriter } from "./DumpWriter";

export class DumpWriterDefault implements DumpWriter {
  private readonly logger: Logger;
  private dir: string;
  constructor(logger: Logger, dir = "dist/reports") {
    this.logger = logger.extend("ReporterDefault");
    this.dir = dir;
  }

  async dump<TContent>(subject: string, content: TContent): Promise<void> {
    const yamlContent = stringify(content, {
      indent: 2,
    });
    this.logger.info({
      event: "report",
      emoji: "📢",
      subject,
    })`報告: ${subject}\n${yamlContent}`;
    const timestamp = format(new Date(), "yyyyMMddHHmmssSSS");
    const path = `${this.dir}/${timestamp}-${subject}.yaml`;
    const yamlFile = new YamlFile<TContent>({
      filePath: path,
      logger: this.logger,
      fallback: null!,
    });
    await yamlFile.write(content);
    const currentPath = process.cwd();
    const absolutePath = `${currentPath}/${path}`;
    this.logger.info(
      {
        emoji: "📂",
      },
      `報告已儲存至`
    );
    console.log(absolutePath);
  }
}
