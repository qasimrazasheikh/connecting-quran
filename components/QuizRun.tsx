'use client';
import Link from 'next/link';
import {useCallback, useEffect, useRef, useState} from 'react';
import {useApp} from './AppProvider';
import {buildQuiz, quizParts, type Question, type QuizData} from '@/lib/quiz';
import {btn, btnGhost, cx, empty} from '@/lib/ui';

const optText = (c: Question['optCls']) => c === 'ar' ? 'font-ar text-2xl leading-[1.8] text-right' : c === 'ur' ? 'urdu text-[17px]' : '';
const optDir = (c: Question['optCls']) => (c ? 'rtl' : undefined);

function Prompt({q, n, small}: {q: Question; n: number; small?: boolean}) {
  return (
    <>
      <div className={small ? '' : 'mb-1.5 text-base'}>{q.prompt}{q.promptRef && <span className="text-[13px] text-muted"> ({q.promptRef})</span>}</div>
      {q.word && <div className={cx('font-ar leading-relaxed text-brand', small ? 'text-[30px]' : 'my-1.5 text-center text-[44px]')} dir="rtl">{q.word}</div>}
      {q.arTokens && <div className="q-ar" style={{fontSize: small ? 22 : 'calc(var(--ar-size) * .9)', lineHeight: 2}}>
        {q.arTokens.map((t, i) => <span key={i}>{i ? ' ' : ''}{i === q.blank ? <span className="mx-[.2em] inline-block min-w-[3.2em] border-b-[3px] border-accent" /> : t}</span>)}</div>}
      {q.trans && <div className={cx('rounded-xl bg-surface2 px-3.5 py-3', q.transUr ? 'urdu text-[17px]' : 'text-[15.5px] leading-relaxed', small && '!text-sm')} dir={q.transUr ? 'rtl' : undefined}>{q.trans}</div>}
      <span hidden>{n}</span>
    </>
  );
}

export default function QuizRun({n, part}: {n: number; part: number}) {
  const {surahs, settings} = useApp();
  const info = surahs[n - 1];
  const [data, setData] = useState<QuizData | null>(null);
  const [err, setErr] = useState('');
  const [qs, setQs] = useState<Question[]>([]);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<{pick: string; ok: boolean}[]>([]);
  const nextBtn = useRef<HTMLButtonElement>(null);
  const parts = info ? quizParts(info.ayahs) : [[1, 1] as [number, number]];
  const pt = Math.min(parts.length, Math.max(1, part));
  const [from, to] = parts[pt - 1];
  const lang = settings.wbwLang || 'ur';
  const trId = settings.trans.find(t => t.startsWith('ur.') || t.startsWith('en.')) || 'en.sahih';

  useEffect(() => {
    let live = true; setData(null); setErr('');
    fetch(`/api/quiz/${n}?lang=${lang}&trans=${encodeURIComponent(trId)}`).then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error || 'HTTP ' + r.status); return j; })
      .then(d => { if (live) setData(d); }).catch(e => { if (live) setErr(e.message); });
    return () => { live = false; };
  }, [n, lang, trId]);
  const start = useCallback(() => { if (data){ setQs(buildQuiz(data, n, from, to, lang)); setI(0); setAnswers([]); window.scrollTo(0, 0); } }, [data, n, from, to, lang]);
  useEffect(() => { start(); }, [start]);

  if (!info) return <div className={empty}>Surah not found.</div>;
  if (err) return <div className={empty}>Could not prepare the quiz. {err}</div>;
  if (!data) return <div className="grid place-items-center py-16 text-muted"><div className="spin mb-2.5" />Preparing your quiz…</div>;
  if (!qs.length) return <div className={empty}>Not enough data to make a quiz for this section.</div>;

  const title = `${info.en}${parts.length > 1 ? ` · Part ${pt} (ayahs ${from}–${to})` : ''}`;
  const shell = 'mx-auto max-w-[760px] rounded-2xl border border-line bg-surface p-[18px]';
  const bar = (w: number) => <div className="mb-3.5 mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface2"><i className="block h-full bg-brand transition-[width] duration-300" style={{width: w + '%'}} /></div>;
  const done = i >= qs.length;

  if (done){
    const score = answers.filter(a => a?.ok).length, pct = score / qs.length;
    const msg = pct === 1 ? 'MashaAllah — perfect score!' : pct >= .8 ? 'Excellent work!' : pct >= .5 ? 'Good effort — review the ones you missed.' : 'Keep going — read the ayahs and try again.';
    return (
      <div className={shell}>
        <div className="flex justify-between text-[13px] text-muted"><span>✎ {title}</span><span>Finished</span></div>
        {bar(100)}
        <div className="pb-1 pt-2.5 text-center"><b className="block text-[44px] text-brand">{score} / {qs.length}</b>{msg}</div>
        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2.5">
          <button className={btn} id="qagain" onClick={start}>↻ Retake (new questions)</button>
          {pt < parts.length ? <Link className={btnGhost} href={`/quiz/${n}/${pt + 1}`}>Next part →</Link> : n < 114 && <Link className={btnGhost} href={`/quiz/${n + 1}/1`}>Next surah →</Link>}
          <Link className={btnGhost} href="/quiz">All quizzes</Link>
        </div>
        <h4 className="mb-1 mt-[18px] text-[13px] uppercase tracking-wider text-muted">Review your answers</h4>
        {qs.map((q, k) => { const a = answers[k]; return (
          <div key={k} className="border-t border-line py-3">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-brand">{k + 1}. {q.type}</div>
            <Prompt q={q} n={n} small />
            <div className={cx('mt-1 text-[13px]', a.ok ? 'text-ok' : 'text-bad')}>{a.ok ? '✓ Your answer' : '✗ Your answer'}: <span className={cx(optText(q.optCls), q.optCls && '!text-lg')} dir={optDir(q.optCls)}>{a.pick}</span></div>
            {!a.ok && <div className="mt-1 text-[13px] text-ok">✓ Correct answer: <span className={cx(optText(q.optCls), q.optCls && '!text-lg')} dir={optDir(q.optCls)}>{q.ans}</span></div>}
            <div className="mt-1 text-[13px]"><Link href={`/surah/${n}/${q.ref}`}>Read ayah {n}:{q.ref} →</Link></div>
          </div>); })}
      </div>
    );
  }

  const q = qs[i], ans = answers[i];
  return (
    <div className={shell}>
      <div className="flex justify-between text-[13px] text-muted"><span>✎ {title}</span><span>Question {i + 1} of {qs.length}</span></div>
      {bar((i / qs.length) * 100)}
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-brand">{q.type}</div>
      <Prompt q={q} n={n} />
      <div className="mt-3.5 grid gap-2">
        {q.opts.map((o, k) => {
          const isAns = ans && o === q.ans, isBad = ans && !ans.ok && o === ans.pick;
          return (
            <button key={k} data-k={k} disabled={!!ans}
              onClick={() => { const ok = o === q.ans; setAnswers(x => { const c = x.slice(); c[i] = {pick: o, ok}; return c; }); setTimeout(() => nextBtn.current?.focus(), 0); }}
              className={cx('qopt flex items-center gap-2.5 rounded-xl border-[1.5px] px-3.5 py-[11px] text-start text-[15.5px] text-ink disabled:cursor-default',
                isAns ? 'ok border-ok bg-[color-mix(in_srgb,#1f9d55_12%,var(--surface))]' : isBad ? 'bad border-bad bg-[color-mix(in_srgb,#d64545_12%,var(--surface))]' : 'border-line bg-surface enabled:hover:border-brand')}>
              <span className="grid size-[26px] flex-none place-items-center rounded-full bg-surface2 text-[13px] font-semibold">{'ABCD'[k]}</span>
              <span className={cx('min-w-0 flex-1', optText(q.optCls))} dir={optDir(q.optCls)}>{o}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2.5">
        <span className={cx('font-semibold', ans?.ok ? 'text-ok' : 'text-bad')} id="qfb">{ans ? (ans.ok ? '✓ Correct!' : '✗ Not quite — the correct answer is highlighted.') : ''}</span>
        {ans && <button ref={nextBtn} className={btn} id="qnext" onClick={() => { setI(i + 1); window.scrollTo(0, 0); }}>{i + 1 < qs.length ? 'Next question →' : 'See my score'}</button>}
      </div>
    </div>
  );
}
