'use client';
import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {useApp} from './AppProvider';
import {Icon} from './Icons';
import {getWord, type WordInfo} from '@/lib/client-data';
import {wordAudioUrl} from '@/lib/meta';
import {btnGhost, cx, empty, iconBtn} from '@/lib/ui';

/** "English — عربي" label: keep the Arabic part in its own direction so the line doesn't scramble. */
function Lbl({t}: {t: string}) {
  const i = t.indexOf(' — ');
  if (i < 0) return <>{t}</>;
  return <>{t.slice(0, i)} <bdi dir="rtl" className="font-ar text-[1.15em] font-normal [unicode-bidi:isolate]">{t.slice(i + 3)}</bdi></>;
}
const POS_BORDER: Record<string, string> = {V: 'border-l-[#2a7de1]', N: 'border-l-[#0f6b4f]', P: 'border-l-[#b8892b]'};

export default function WordCard() {
  const {word, closeWord, settings, toast} = useApp();
  const [info, setInfo] = useState<WordInfo | null>(null);
  const [err, setErr] = useState('');
  const box = useRef<HTMLDivElement>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const [aud, setAud] = useState<'idle' | 'loading' | 'playing'>('idle');

  useEffect(() => {
    if (!word) return;
    let live = true; setInfo(null); setErr(''); setAud('idle');
    getWord(word.s, word.a, {w: word.w, t: word.t}).then(d => {
      if (!live) return; setInfo(d);
      if (settings.wordSound && d.w) say(d.w);
    }).catch(e => { if (live) setErr(e.message); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word]);

  // place next to the word on wide screens (phones get a bottom sheet from CSS)
  useLayoutEffect(() => {
    const el = box.current; if (!el || !word) return;
    if (innerWidth <= 760){ el.style.top = ''; el.style.left = ''; return; }
    const r = word.rect, cw = el.offsetWidth, ch = el.offsetHeight;
    let top = r.bottom + 8; if (top + ch > innerHeight - 8) top = Math.max(70, r.top - ch - 8);
    el.style.top = top + 'px';
    el.style.left = Math.max(8, Math.min(r.left + r.width / 2 - cw / 2, innerWidth - cw - 8)) + 'px';
  }, [word, info, err]);

  // click outside closes (a click on another word opens that word instead)
  useEffect(() => {
    if (!word) return;
    const off = (e: MouseEvent) => { const t = e.target as Element; if (!box.current?.contains(t) && !t.closest?.('.w')) closeWord(); };
    const t = setTimeout(() => document.addEventListener('click', off), 0);
    return () => { clearTimeout(t); document.removeEventListener('click', off); };
  }, [word, closeWord]);

  const say = (w: number) => {
    if (!word) return;
    if (!audio.current) {
      const el = audio.current = new Audio();
      // no 'pause' listener: changing src queues a pause event that would clobber the loading state
      el.onwaiting = () => setAud('loading');
      el.onplaying = () => setAud('playing');
      el.onended = el.onerror = () => setAud('idle');
    }
    setAud('loading');
    audio.current.src = wordAudioUrl(word.s, word.a, w);
    audio.current.play().catch(() => { setAud('idle'); toast('Could not play word audio'); });
  };

  if (!word) return null;
  const {s, a} = word, w = info?.w || word.w || 0;
  return (
    <div ref={box} id="wcard" role="dialog" aria-label="Word grammar"
      className="fixed z-45 max-h-[min(70vh,560px)] w-[min(380px,calc(100%-16px))] overflow-auto rounded-[14px] border border-line bg-surface p-3.5 shadow-[0_12px_40px_rgba(0,0,0,.22)] max-[760px]:inset-x-2 max-[760px]:bottom-2 max-[760px]:max-h-[65vh] max-[760px]:w-auto">
      <div className="flex items-start gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="font-ar text-[38px] leading-normal text-brand" dir="rtl" style={word.font ? {fontFamily: word.font} : undefined}>{word.text}</div>
          {info?.translit && <div className="text-sm italic text-muted">{info.translit}</div>}
        </div>
        <button className={iconBtn} aria-label="Close" onClick={closeWord}><Icon.x /></button>
      </div>
      {err && <div className={cx(empty, 'mt-3')}>Grammar data could not load. {err}</div>}
      {!info && !err && <div className="grid place-items-center py-8 text-muted"><div className="spin mb-2" />Loading grammar…</div>}
      {info && <>
        {(info.meanEn || info.meanUr) && <div className="mt-0.5 text-[15px]">
          {info.meanEn && <div><b>Meaning:</b> {info.meanEn}</div>}
          {info.meanUr && <span className="urdu block text-[17px]" style={{lineHeight: 2}}>{info.meanUr}</span>}
        </div>}
        {info.segs.length ? <>
          <div className="mt-3 border-t border-line pt-2.5">
            <h5 className="mb-1.5 text-[11.5px] uppercase tracking-wider text-muted">Summary</h5>
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm [&>span:nth-child(odd)]:text-muted">
              <span>Type</span><span>{info.type ? <Lbl t={info.type} /> : '—'}</span>
              {info.root && <><span>Root</span><span className="font-ar text-xl leading-snug">{[...info.root].join(' ')}</span></>}
              {info.lemma && <><span>Lemma</span><span className="font-ar text-xl leading-snug">{info.lemma}</span></>}
              <span>Location</span><span>{s}:{a}, word {w}</span>
            </div>
          </div>
          <div className="mt-3 border-t border-line pt-2.5">
            <h5 className="mb-1.5 text-[11.5px] uppercase tracking-wider text-muted">Parts of the word ({info.segs.length})</h5>
            {info.segs.map((sg, i) => (
              <div key={i} className={cx('mb-1.5 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-[10px] border border-l-4 border-line px-2.5 py-2', POS_BORDER[sg.pos])} dir="ltr">
                <div className="whitespace-nowrap px-1 text-center font-ar text-[26px] leading-normal text-brand" dir="rtl">{sg.text}</div>
                <div className="min-w-0"><b className="block text-sm leading-normal"><Lbl t={sg.name} /></b>
                  {sg.details.map((d, k) => <small key={k} className="block text-[12.5px] leading-relaxed text-muted"><Lbl t={d} /></small>)}</div>
              </div>
            ))}
          </div>
        </> : <div className="mt-3 border-t border-line pt-2.5"><div className={empty}>No grammar data found for this word.</div></div>}
        {w > 0 && <button className={cx(btnGhost, 'mt-2.5 w-full')} data-wc="say" disabled={aud === 'loading'} aria-busy={aud === 'loading'} onClick={() => say(w)}>
          {aud === 'loading' ? <><span className="spin inline-block" style={{width: 16, height: 16, borderWidth: 2}} /> Loading audio…</>
            : aud === 'playing' ? <><Icon.play /> Playing…</>
            : <><Icon.play /> Hear this word</>}
        </button>}
        <div className="mt-2.5 flex flex-wrap justify-between gap-2 text-xs text-muted"><span>Grammar: Quranic Arabic Corpus (GPL)</span>
          <a href={`https://corpus.quran.com/wordmorphology.jsp?location=(${s}:${a}:${w})`} target="_blank" rel="noopener">Full analysis ↗</a></div>
      </>}
      {word.onAyah && <button className={cx(btnGhost, 'mt-2.5 w-full')} onClick={() => { const f = word.onAyah!; closeWord(); f(); }}>Ayah {s}:{a} options (play, tafseer…)</button>}
    </div>
  );
}
