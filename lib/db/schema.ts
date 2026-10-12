/** Encyclopedia catalogue: works/series ("sources") and resources tied to ayahs ("entries"). Curated in /admin. */
import {index, integer, jsonb, pgTable, serial, smallint, text, timestamp, uniqueIndex} from 'drizzle-orm/pg-core';
import {DELIVERY, KINDS, LANGS, SCHOOLS, STATUS} from './enums.ts';
export {DELIVERY, KINDS, LANGS, SCHOOLS, STATUS};

export const sources = pgTable('sources', {
  id: serial('id').primaryKey(),
  /** Stable key; for API tafseers it is the API's edition slug. */
  slug: text('slug').notNull().unique(),
  kind: text('kind', {enum: KINDS}).notNull(),
  name: text('name').notNull(),
  author: text('author').notNull().default(''),
  lang: text('lang', {enum: LANGS}).notNull(),
  school: text('school', {enum: SCHOOLS}).notNull().default('general'),
  delivery: text('delivery', {enum: DELIVERY}).notNull().default('api'),
  /** For `link` delivery: URL with {s}, {a} and {surah} (English surah name) placeholders. */
  urlPattern: text('url_pattern').notNull().default(''),
  description: text('description').notNull().default(''),
  licence: text('licence').notNull().default(''),
  attribution: text('attribution').notNull().default(''),
  homepage: text('homepage').notNull().default(''),
  status: text('status', {enum: STATUS}).notNull().default('pending'),
  sort: integer('sort').notNull().default(100),
  /** Curator's private notes (why hidden, licence correspondence, …). */
  notes: text('notes').notNull().default(''),
  createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', {withTimezone: true}).notNull().defaultNow(),
});

export const entries = pgTable('entries', {
  id: serial('id').primaryKey(),
  sourceId: integer('source_id').notNull().references(() => sources.id, {onDelete: 'cascade'}),
  surah: smallint('surah').notNull(),
  /** Null ayah range = the whole surah. */
  ayahFrom: smallint('ayah_from'),
  ayahTo: smallint('ayah_to'),
  kind: text('kind', {enum: KINDS}).notNull(),
  title: text('title').notNull().default(''),
  url: text('url').notNull().default(''),
  /** Seconds into the video/audio where this ayah range starts. */
  startSec: integer('start_sec'),
  body: text('body').notNull().default(''),
  status: text('status', {enum: STATUS}).notNull().default('approved'),
  /** Where the entry came from: an import script, the curator, or an AI suggestion awaiting review. */
  origin: text('origin', {enum: ['import', 'admin', 'ai']}).notNull().default('admin'),
  createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', {withTimezone: true}).notNull().defaultNow(),
}, t => [index('entries_ayah_idx').on(t.surah, t.ayahFrom, t.ayahTo), index('entries_source_idx').on(t.sourceId)]);

/**
 * Ayahs with shared wording (QUL "matching ayah" data). Word positions in `matchWords` ([from, to], 1-based) point into
 * the related ayah, so its shared words can be highlighted. Re-imported as a whole: `npm run db:import-related`.
 */
export const relatedAyahs = pgTable('related_ayahs', {
  id: serial('id').primaryKey(),
  surah: smallint('surah').notNull(),
  ayah: smallint('ayah').notNull(),
  relSurah: smallint('rel_surah').notNull(),
  relAyah: smallint('rel_ayah').notNull(),
  words: smallint('words').notNull(),
  /** % of the related ayah's words that match */
  coverage: smallint('coverage').notNull(),
  score: smallint('score').notNull(),
  matchWords: jsonb('match_words').$type<[number, number][]>().notNull().default([]),
  source: text('source').notNull().default('qul-matching'),
}, t => [index('related_ayah_idx').on(t.surah, t.ayah), uniqueIndex('related_pair_uq').on(t.source, t.surah, t.ayah, t.relSurah, t.relAyah)]);

export type Source = typeof sources.$inferSelect;
export type Entry = typeof entries.$inferSelect;
