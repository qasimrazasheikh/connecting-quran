/** Database client (server only). Null when DATABASE_URL is unset, e.g. in the offline tests: callers fall back to built-in lists. */
import 'server-only';
import {neon} from '@neondatabase/serverless';
import {drizzle} from 'drizzle-orm/neon-http';
import * as schema from './schema';

const url = process.env.DATABASE_URL?.trim();
export const db = url ? drizzle({client: neon(url), schema}) : null;
export {schema};
