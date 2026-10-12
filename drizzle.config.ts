/** drizzle-kit (schema migrations): `npm run db:generate` after editing lib/db/schema.ts, then `npm run db:migrate`. */
import {existsSync} from 'node:fs';
import {defineConfig} from 'drizzle-kit';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set (add it to .env.local)');

export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dbCredentials: {url: process.env.DATABASE_URL},
});
