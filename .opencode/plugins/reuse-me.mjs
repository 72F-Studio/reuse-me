import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function parseCommandFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;
  const description = match[1].match(/description:\s*(.+)/)?.[1]?.trim();
  return { description, template: match[2].trim() };
}

export default async () => ({
  config: async (config) => {
    config.command ||= {};

    const commandDir = path.join(__dirname, "..", "command");
    for (const file of fs.readdirSync(commandDir).filter((name) => name.endsWith(".md"))) {
      const name = path.basename(file, ".md");
      const parsed = parseCommandFile(path.join(commandDir, file));
      if (parsed) config.command[name] = parsed;
    }

    config.skills ||= {};
    config.skills.paths ||= [];
    const skillsDir = path.resolve(__dirname, "../../skills");
    if (!config.skills.paths.includes(skillsDir)) {
      config.skills.paths.push(skillsDir);
    }
  }
});
