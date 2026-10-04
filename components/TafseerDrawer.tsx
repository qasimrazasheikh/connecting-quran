'use client';
import Link from 'next/link';
import {useEffect, useRef} from 'react';
import {useApp} from './AppProvider';
import Drawer from './Drawer';
import TafseerPanel from './TafseerPanel';
import {stepAyah} from '@/lib/step';
import {btnGhost} from '@/lib/ui';

export default function TafseerDrawer() {
  const {tafsir, openTafsir, closeTafsir, surahs, tafTab} = useApp();
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => { body.current?.scrollTo(0, 0); }, [tafsir?.s, tafsir?.a]);
  const last = useRef({s: 1, a: 1}); if (tafsir) last.current = {s: tafsir.s, a: tafsir.a};
  const {s, a} = last.current;
  const go = (dir: number) => { const p = stepAyah(surahs, s, a, dir); if (p) openTafsir(p.s, p.a); };
  return (
    <Drawer id="tafDrawer" open={!!tafsir} onClose={closeTafsir} label="Tafseer" bodyRef={body}
      title={<span id="tafTitle">Tafseer · {surahs[s - 1]?.en ? surahs[s - 1].en + ' ' : ''}{s}:{a}</span>}
      foot={<>
        <button className={btnGhost} id="tafPrev" disabled={s === 1 && a === 1} onClick={() => go(-1)}>← Previous</button>
        <Link className={btnGhost} id="tafOpenPage" href={`/${tafTab === 'videos' ? 'videos' : 'tafseer'}/${s}/${a}`} onClick={closeTafsir}>Open full page</Link>
        <button className={btnGhost} id="tafNext" disabled={s === 114 && a === 6} onClick={() => go(1)}>Next →</button>
      </>}>
      <TafseerPanel s={s} a={a} />
    </Drawer>
  );
}
