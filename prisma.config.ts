import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js keeps secrets in .env.local; the Prisma CLI needs them too.
config({ path: ".env.local", quiet: true });

// Migrations are Django's (condorin-backend). Prisma is only used to generate the client.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: process.env.DATABASE_URL ?? "" },
});
