import { Kysely } from 'kysely';
import { DatabaseSchema } from './schema.js';
export declare function getDb(): Kysely<DatabaseSchema>;
