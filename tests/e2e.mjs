// End-to-end check against the mock API. Needs: mock-api.mjs on :4010 and `next start` on :3100 (see README).
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
let pw; try{ pw = require('playwright'); }catch{ pw = require('/home/claude/.npm-global/lib/node_modules/playwright'); }
const BASE = process.env.BASE || 'http://localhost:3100';
const OUT = process.env.SHOTS || '/tmp/shots'; fs.mkdirSync(OUT, {recursive: true});
const b = await pw.chromium.launch();
const ctx = await b.newContext({viewport: {width: 1280, height: 900}});
const p = await ctx.newPage();
const errs = []; p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|Failed to load resource/.test(m.text())) errs.push(m.text()); });
const wav = fs.readFileSync(new URL('./silence.wav', import.meta.url));
await ctx.route(/cdn\.jsdelivr\.net/, r => r.fulfill({body: "", contentType: "text/css"}));
await ctx.route(/cdn\.islamic\.network|audio\.qurancdn\.com/, r => r.fulfill({contentType: 'audio/wav', body: wav}));
let fails = 0;
const ok = (cond, msg, extra = '') => { console.log((cond ? '  ok  ' : '  FAIL') + ' ' + msg + (extra !== '' ? ' → ' + extra : '')); if (!cond) fails++; };
const go = async u => { await p.goto(BASE + u); await p.waitForLoadState('networkidle', {timeout: 8000}).catch(() => {}); await p.waitForTimeout(300); };
const shot = n => p.screenshot({path: `${OUT}/${n}.png`});

console.log('# home');
await go('/'); await p.waitForSelector('a[href="/surah/1"]');
ok(await p.locator('a[href^="/surah/"]').count() >= 114, 'surah cards');
await p.fill('#q', '114'); ok(await p.locator('main a[href^="/surah/"]').count() === 1, 'filter by number');
await p.fill('#q', ''); await shot('home');

console.log('# surah reader');
await go('/surah/2/3'); await p.waitForSelector('#a-2-286');
ok(await p.locator('article.ayah').count() === 286, 'ayah count');
ok(await p.locator('#a-2-3.hl').count() === 1, 'focus highlight');
ok(!(await p.locator('#a-2-1 .atext').innerText()).includes('بِسْمِ'), 'bismillah stripped from 2:1');
await shot('surah');

console.log('# tafseer drawer');
await p.click('#a-2-3 [data-act=tafsir]'); await p.waitForSelector('#tafDrawer .tafsir');
const th = await p.locator('#tafDrawer .tafsir').first().innerHTML();
ok(!/script|onclick/.test(th), 'tafseer html sanitised', th.slice(0, 80));
const names = await p.locator('#tafDrawer section.acc b').allInnerTexts();
ok(names.length >= 4 && !names.includes('Broken dup'), 'accordion sections', names.join(' | '));
await p.click('#tafDrawer [data-acc=expand]'); await p.waitForTimeout(500);
ok(await p.locator('#tafDrawer section.acc [aria-expanded=true]').count() === names.length, 'expand all');
ok(await p.locator('#tafDrawer .tafsir .qar').count() > 0, 'Quran quote marked inside Urdu tafseer');
await shot('tafsir-drawer');
await p.click('#tafNext'); await p.waitForTimeout(500);
ok((await p.locator('#tafTitle').innerText()).includes('2:4'), 'next ayah', await p.locator('#tafTitle').innerText());
await p.waitForTimeout(500);
ok((await p.locator('#tafDrawer').innerText()).includes('No note for this ayah'), '404 shows "no note"');
await p.click('#tafDrawer [data-acc=collapse]');
ok(await p.locator('#tafDrawer section.acc [aria-expanded=true]').count() === 0, 'collapse all');
await p.click('#tafDrawer [data-tab=videos]'); await p.waitForSelector('#tafDrawer .vcard');
ok(await p.locator('#tafDrawer .vcard').count() === 2, 'video cards');
await p.click('#tafDrawer [data-tab=text]');
await p.click('#tafDrawer [data-acc=layout]'); await p.waitForSelector('#tafDrawer .titem');
ok(await p.locator('#tafDrawer .titem[aria-selected=true]').count() === 1, 'list + reader layout');
await shot('tafsir-split');
await p.click('#tafDrawer [data-ts=layout]');
await p.click('#tafDrawer [data-acc=edit]'); await p.waitForSelector('#tafSet input[data-taf]');
ok(await p.locator('#tafSet input[data-taf]').count() >= 5, 'edit list opens settings');
await p.keyboard.press('Escape'); await p.waitForTimeout(300);

console.log('# word card');
await p.locator('#a-2-1 .w').nth(1).click(); await p.waitForSelector('#wcard [data-wc=say]');
const wc = await p.locator('#wcard').innerText();
ok(wc.includes('Perfect verb') && wc.includes('en-m2') && /parts of the word \(3\)/i.test(wc), 'grammar card', wc.replace(/\s+/g, ' '));
await shot('word');
await p.click('#wcard [data-wc=say]');
await p.mouse.click(5, 300); ok(await p.locator('#wcard').count() === 0, 'click outside closes card');

console.log('# player');
await p.click('#a-2-1 [data-act=play]'); await p.waitForSelector('#player');
ok((await p.locator('#plTitle').innerText()).includes('2:1'), 'player shows ayah');
await p.click('#plRep'); await p.click('[data-rm=ayah]'); await p.click('[data-rt="2"]');
ok((await p.locator('#plRec').innerText()).includes('repeat'), 'repeat mode', await p.locator('#plRec').innerText());
await p.click('[data-sp="1.5"]'); ok((await p.locator('#plSpeed').innerText()).includes('1.5'), 'speed');
await shot('player'); await p.click('#plClose');

console.log('# bookmarks + settings');
await p.click('#a-2-5 [data-act=bm]');
await p.click('#setBtn'); await p.waitForSelector('input[value="en.pickthall"]');
await p.check('input[value="en.pickthall"]'); await p.keyboard.press('Escape'); await p.waitForTimeout(1500);
ok(await p.locator('#a-2-1 .tr-text').count() === 3, 'third translation after closing settings');
await p.click('#setBtn'); await p.click('#scriptSeg [data-v=indopak]'); await p.check('#wbwOn'); await p.keyboard.press('Escape'); await p.waitForTimeout(1500);
ok(await p.locator('#a-2-1 .w').first().innerText().then(t => t.includes('وَ هُوَ')), 'Indo-Pak split word grouped as one tappable word');
ok(await p.locator('#a-2-1 .wm').count() > 0, 'word-by-word meanings', await p.locator('#a-2-1 .wm').first().innerText().catch(() => ''));
await shot('indopak-wbw');
await p.click('#setBtn'); await p.click('#scriptSeg [data-v=uthmani]'); await p.uncheck('#wbwOn'); await p.check('#tjOn'); await p.click('#palSeg [data-v=ocean]'); await p.click('#themeSeg [data-v=dark]'); await p.keyboard.press('Escape'); await p.waitForTimeout(1500);
ok(await p.locator('#a-2-1 [class^=tj-]').count() > 0, 'tajweed colours');
ok(await p.evaluate(() => document.documentElement.dataset.palette + '/' + document.documentElement.dataset.theme) === 'ocean/dark', 'palette + dark theme');
await shot('tajweed-ocean-dark');
await p.reload(); await p.waitForSelector('#a-2-1');
ok(await p.evaluate(() => document.documentElement.dataset.theme) === 'dark', 'theme kept after reload (cookie)');
await p.click('#setBtn'); await p.click('#tjOn'); await p.click('#palSeg [data-v=midnight]'); await p.click('#themeSeg [data-v=light]'); await p.keyboard.press('Escape'); await p.waitForTimeout(1000);

console.log('# juz, mushaf');
await go('/juz/1');
ok(await p.locator('article.ayah').count() === 4 && (await p.locator('main').innerText()).includes('2. Surah-2'), 'juz with surah headings');
await go('/mushaf/2'); await p.waitForSelector('.mayah');
ok(await p.locator('.mayah').count() === 3 && await p.locator('.mtitle').count() === 1, 'mushaf page');
await p.locator('.mayah .endmark').first().click(); await p.waitForSelector('#mMenu');
ok((await p.locator('#mMenu').innerText()).includes('1:7'), 'ayah menu');
await shot('mushaf');
await p.click('#mMenu [data-m=tafsir]'); await p.waitForSelector('#tafDrawer .acc'); await p.keyboard.press('Escape');
await p.click('#mNext'); await p.waitForURL('**/mushaf/3'); await p.waitForSelector('.mayah');
ok(await p.locator('.mayah').count() === 2, 'next page');
await p.keyboard.press('ArrowRight'); await p.waitForURL('**/mushaf/2'); ok(true, 'arrow key turns page');
await go('/surah/2/5'); await p.waitForSelector('#a-2-5');
await p.locator('header a', {hasText: 'Mushaf'}).first().click(); await p.waitForURL('**/mushaf/2'); await p.waitForSelector('.mayah');
ok(await p.locator('.mayah.sel[data-key="2:1"]').count() === 1, 'Mushaf link opens at the surah start with its first ayah highlighted');
await go('/surah/1/5'); await p.waitForSelector('#a-1-5');
await p.locator('header a', {hasText: 'Mushaf'}).first().click(); await p.waitForURL('**/mushaf/1'); await p.waitForSelector('.mayah');
ok(await p.locator('.mayah').first().getAttribute('data-key') === '1:1' && await p.locator('.mayah.sel').count() === 0, 'no highlight when the surah starts at the top of the page');

console.log('# tafseer page');
await go('/tafseer/2/10'); await p.waitForSelector('section.acc');
ok(await p.locator('#tpQuote .tr-text').count() === 2, 'quote with translations');
await p.click('[data-tab=videos]'); await p.waitForURL('**/videos/2/10'); await p.waitForSelector('.vcard');
ok(true, 'videos tab changes URL');
await shot('videos-page');
await go('/tafseer'); await p.waitForURL('**/tafseer/1/1'); ok(true, '/tafseer redirects');

console.log('# translate bar');
await go('/tafseer/2/5'); await p.waitForSelector('section.acc');
await p.selectOption('section.acc ~ div select', 'ar-tafsir-muyassar'); await p.waitForSelector('.tafsir.arabic');
await p.evaluate(() => { const el = document.querySelector('.tafsir.arabic p'); const r = document.createRange(); r.selectNodeContents(el); getSelection().removeAllRanges(); getSelection().addRange(r); });
await p.waitForSelector('#selBtn', {timeout: 3000}).catch(() => {});
ok(await p.locator('#selBtn').count() === 1, 'Google Translate bar on Arabic selection');

console.log('# search');
await go('/search?q=mercy'); await p.waitForSelector('.sres');
ok(await p.locator('.sres').count() === 50 && await p.locator('.sres mark').count() >= 50, '50 results with highlight');
await p.click('#sMore'); ok(await p.locator('.sres').count() === 100, 'show more');
await go('/search?q=nothing'); ok((await p.locator('main').innerText()).includes('No results'), 'no results message');
await go('/search?q=' + encodeURIComponent('رحمة')); await p.waitForSelector('.sres');
ok(await p.locator('.sres mark').count() > 0, 'Arabic highlight');
await p.fill('#jumpIn', '2:255'); await p.press('#jumpIn', 'Enter'); await p.waitForURL('**/surah/2/255'); ok(true, 'jump box');

console.log('# quiz');
await go('/quiz'); await p.waitForSelector('#qlist a');
ok(await p.locator('a[href^="/quiz/2/"]').count() === 10, 'surah 2 has 10 parts');
await go('/quiz/2/1'); await p.waitForSelector('.qopt');
let n = 0;
while (await p.locator('.qopt').count() && n < 12){ await p.locator('.qopt').first().click(); await p.click('#qnext'); n++; }
await p.waitForSelector('#qagain');
ok((await p.locator('main').innerText()).includes('/ 10'), 'quiz finished with score', n + ' questions');
await shot('quiz-result');

console.log('# bookmarks + continue reading');
await go('/bookmarks'); await p.waitForSelector('[data-del]');
ok(await p.locator('[data-del]').count() === 1, 'bookmark saved');
await go('/'); await p.waitForSelector('text=Continue reading'); ok(true, 'continue reading');
await go('/#/surah/2/7'); await p.waitForURL('**/surah/2/7'); ok(true, 'old #/ links redirect');

console.log('# mobile');
await p.setViewportSize({width: 390, height: 820});
for (const u of ['/', '/surah/2', '/mushaf/2', '/tafseer/2/3', '/quiz/2/1']){
  await go(u);
  ok(!(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)), 'no sideways scroll ' + u);
}
await go('/surah/2'); await p.waitForSelector('article.ayah'); await shot('mobile-surah');
await p.click('#a-2-1 [data-act=play]'); await p.waitForSelector('#plTitle');
ok((await p.locator('#plTitle').boundingBox()).width > 200, 'phone player title has room'); await p.click('#plClose');
await p.locator('#a-2-1 .w').first().click(); await p.waitForSelector('#wcard [data-wc=say]'); await shot('mobile-word');

console.log(errs.length ? '\nConsole errors:\n' + [...new Set(errs)].join('\n') : '\nNo console errors');
console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
await b.close();
process.exit(fails || errs.length ? 1 : 0);
