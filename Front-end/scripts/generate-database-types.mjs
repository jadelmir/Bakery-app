import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";

const projectRoot = resolve(import.meta.dirname, "..");
const outputPath = resolve(
  projectRoot,
  "src",
  "lib",
  "supabase",
  "database.types.ts",
);
const cliEntry = resolve(
  projectRoot,
  "node_modules",
  "supabase",
  "dist",
  "supabase.js",
);
const sourceFlag = process.argv.includes("--linked") ? "--linked" : "--local";
const result = spawnSync(
  process.execPath,
  [
    cliEntry,
    "gen",
    "types",
    sourceFlag,
    "--lang",
    "typescript",
    "--schema",
    "public",
  ],
  {
    cwd: projectRoot,
    encoding: "utf8",
    env: process.env,
    shell: false,
  },
);

if (result.status !== 0) {
  process.stderr.write(
    result.stderr ||
      result.error?.message ||
      "Supabase type generation failed.\n",
  );
  process.exit(result.status ?? 1);
}

const generated = `${result.stdout.trimEnd()}\n`
  .replaceAll("\r\n", "\n")
  .replace(
    /\n[ ]{2}\/\/ Allows to automatically instantiate createClient with right options\n[ ]{2}\/\/ instead of createClient<Database, \{ PostgrestVersion: 'XX' \}>\(URL, KEY\)\n[ ]{2}__InternalSupabase: \{\n[ ]{4}PostgrestVersion: "[^"]+"\n[ ]{2}\}\n/,
    "\n",
  );

if (process.argv.includes("--check")) {
  if (!existsSync(outputPath)) {
    process.stderr.write("Database types are missing. Run pnpm supabase:types.\n");
    process.exit(1);
  }

  const current = readFileSync(outputPath, "utf8").replaceAll("\r\n", "\n");
  if (current !== generated) {
    process.stderr.write(
      "Database types are stale. Run pnpm supabase:types and review the result.\n",
    );
    process.exit(1);
  }

  process.stdout.write("Database types are current.\n");
  process.exit(0);
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, generated, "utf8");
process.stdout.write(`Generated ${outputPath}\n`);
