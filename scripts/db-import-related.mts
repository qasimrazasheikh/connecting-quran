/**
 * Imports QUL's "matching ayah" data (ayahs with shared wording) into related_ayahs, replacing the previous import.
 * Download the JSON from qul.tarteel.ai (Resources → Similar Ayah; needs a free QUL login) into data/qul/.
 * Run: npm run db:import-related [-- path/to/file.json]
 */
import {readFileSync} from 'node:fs';
import {eq} from 'drizzle-orm';
import {neon} from '@neondatabase/serverless';
import {drizzle} from 'drizzle-orm/neon-http';
import {relatedAyahs} from '../lib/db/schema.ts';

type Match = {matched_ayah_key: string; matched_words_count: number; coverage: number; score: number; match_words: [number, number][]};
const url = process.env.DATABASE_URL?.trim();
if (!url) throw new Error('DATABASE_URL is not set (add it to .env.local)');
const db = drizzle({client: neon(url)});
const file = process.argv[2] || 'data/qul/matching-ayah.json';
const SOURCE = 'qul-matching';
const key = (k: string) => { const m = /^(\d{1,3}):(\d{1,3})$/.exec(k); if (!m || +m[1] < 1 || +m[1] > 114) throw new Error(`Bad ayah key ${k}`); return [+m[1], +m[2]]; };

async function main(){
  const data = JSON.parse(readFileSync(file, 'utf8')) as Record<string, Match[]>;
  const rows: (typeof relatedAyahs.$inferInsert)[] = [];
  for (const [k, list] of Object.entries(data)){
    const [surah, ayah] = key(k);
    for (const m of list){
      const [relSurah, relAyah] = key(m.matched_ayah_key);
      rows.push({surah, ayah, relSurah, relAyah, words: m.matched_words_count, coverage: m.coverage, score: m.score,
        matchWords: (m.match_words || []).filter(r => Array.isArray(r) && r.length === 2).map(([a, b]) => [+a, +b] as [number, number]), source: SOURCE});
    }
  }
  if (!rows.length) throw new Error('No matches found in the file');
  await db.delete(relatedAyahs).where(eq(relatedAyahs.source, SOURCE));
  for (let i = 0; i < rows.length; i += 500) await db.insert(relatedAyahs).values(rows.slice(i, i + 500)).onConflictDoNothing();
  console.log(`Imported ${rows.length} related-ayah pairs for ${Object.keys(data).length} ayahs from ${file}.`);
}
main().catch(e => { console.error(e.message); process.exit(1); });
