import { dirname } from "path";
import { DataSource } from "typeorm";
import { fileURLToPath } from "url";

import "reflect-metadata";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || "",
  database: process.env.DB_NAME || "",
  password: process.env.DB_PASSWORD || "",
  synchronize: false,
  logging: false,
  entities: [__dirname + "/entities/**/*.ts"],
  migrations: ["src/db/migrations/*.ts"],
  subscribers: [],
});
