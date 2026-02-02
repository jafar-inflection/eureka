import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  schema: path.join(__dirname, "schema.prisma"),
  migrate: {
    async url() {
      return process.env.DATABASE_URL;
    },
  },
});

