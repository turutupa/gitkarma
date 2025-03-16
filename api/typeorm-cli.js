import { execSync } from "child_process";
import dotenv from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataSourcePath = resolve(__dirname, "src/db/ormconfig.ts");
const migrationDir = resolve(__dirname, "/src/db/migrations/migration");

const args = process.argv.slice(2);
const command = args.join(" ");

// Append migration parameters only for generating migrations
let extraArgs = "";
if (command.indexOf("migration:generate") !== -1) {
  extraArgs = migrationDir;
}

const env = {
  ...process.env,
  TS_NODE_PROJECT: "tsconfig.migrations.json",
};

execSync(
  `node --loader ts-node/esm node_modules/typeorm/cli.js ${command} ${extraArgs} -d ${dataSourcePath}`,
  { stdio: "inherit", env }
);
