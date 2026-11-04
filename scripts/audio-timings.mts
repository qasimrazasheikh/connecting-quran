/**
 * Builds public/timings/<id>.json for reciters recorded as one file per surah, so the player can play an ayah by seeking
 * inside its surah: {"u": [file url per surah], "t": [[start ms of each ayah] per surah]}.
 *   - quran.com reciters: the files and verse timings quran.com's own player uses (QDC audio API).
 *   - Quran for Android reciters: QuranicAudio files plus the app's timing database (a zipped SQLite file).
 * Re-run after adding a reciter to TIMED in lib/meta.ts:  node scripts/audio-timings.mts
 */
import {mkdirSync, writeFileSync} from 'node:fs';
import {inflateRawSync} from 'node:zlib';
// @ts-expect-error node:sqlite is newer than the project's Node types
import {DatabaseSync} from 'node:sqlite';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

type Src = {id: string; qdc?: number; db?: string; files?: string};
const SOURCES: Src[] = [
  {id: 'ghamdi', qdc: 13},
  {id: 'alijabir', qdc: 158},
  {id: 'baleela', qdc: 160},
  {id: 'tunaiji', qdc: 161},
  {id: 'badr', db: 'badr_al_turki', files: 'https://download.quranicaudio.com/quran/badr_al_turki/mp3/'},
  {id: 'tahoun', db: 'ahmad_tahoun', files: 'https://download.quranicaudio.com/quran/ahmad_tahoun/mp3/'},
];
const QDC = 'https://api.qurancdn.com/api/qdc/audio/reciters', DBS = 'https://files.quran.app/hafs/databases/audio/';
const OUT = new URL('../public/timings/', import.meta.url);
const p3 = (n: number) => String(n).padStart(3, '0');

async function fromQdc(id: number) {
  const u: string[] = [], t: number[][] = [];
  for (let s = 1; s <= 114; s++){
    const d = await (await fetch(`${QDC}/${id}/audio_files?chapter=${s}&segments=true`)).json() as {audio_files: {audio_url: string; verse_timings: {verse_key: string; timestamp_from: number}[]}[]};
    const f = d.audio_files[0];
    if (!f) throw new Error(`reciter ${id}: no file for surah ${s}`);
    u.push(f.audio_url.replace(/([^:])\/\//g, '$1/'));
    t.push(f.verse_timings.map(v => v.timestamp_from));
  }
  return {u, t};
}

/** The one file in a zip (stored or deflated), read from its local header. */
function unzipOne(buf: Buffer) {
  if (buf.readUInt32LE(0) !== 0x04034b50) throw new Error('not a zip');
  const method = buf.readUInt16LE(8), size = buf.readUInt32LE(18), start = 30 + buf.readUInt16LE(26) + buf.readUInt16LE(28);
  const data = buf.subarray(start, start + size);
  return method === 0 ? data : inflateRawSync(data);
}

async function fromDb(name: string, files: string) {
  const zip = Buffer.from(await (await fetch(DBS + name + '.zip')).arrayBuffer());
  const path = join(tmpdir(), name + '.db');
  writeFileSync(path, unzipOne(zip));
  const db = new DatabaseSync(path, {readOnly: true});
  // ayah 999 rows mark where a surah's recitation ends; ayah 0 is the opening isti'adha / basmala
  const rows = db.prepare('SELECT sura, ayah, time FROM timings WHERE ayah BETWEEN 1 AND 286 ORDER BY sura, ayah').all() as {sura: number; ayah: number; time: number}[];
  db.close();
  const t: number[][] = Array.from({length: 114}, () => []);
  rows.forEach(r => { t[r.sura - 1][r.ayah - 1] = r.time; });
  return {u: Array.from({length: 114}, (_, i) => files + p3(i + 1) + '.mp3'), t};
}

mkdirSync(OUT, {recursive: true});
for (const src of SOURCES){
  const d = src.qdc ? await fromQdc(src.qdc) : await fromDb(src.db!, src.files!);
  const gaps = d.t.flatMap((x, i) => x.length && !x.includes(undefined as never) ? [] : [i + 1]);
  if (gaps.length) throw new Error(`${src.id}: missing timings in surah ${gaps.join(', ')}`);
  writeFileSync(new URL(src.id + '.json', OUT), JSON.stringify(d));
  console.log(`${src.id}: ${d.t.reduce((n, x) => n + x.length, 0)} ayahs`);
}
