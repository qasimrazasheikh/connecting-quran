'use client';
import Link from 'next/link';
import {useState} from 'react';
import {useApp} from './AppProvider';
import {QUIZ_LEN, QUIZ_PART} from '@/lib/meta';
import {quizParts} from '@/lib/quiz';
import {card, grid, numBadge, rhead} from '@/lib/ui';

export default function QuizList() {
  const {surahs} = useApp();
  const [q, setQ] = useState('');
  const qq = q.toLowerCase().replace(/[^a-z0-9]/g, '');
  return (
    <>
      <section className={rhead}><h1 className="mb-0.5 mt-1 text-[22px] font-bold">Surah Quizzes</h1>
        <div className="text-sm text-muted">Test yourself on word meanings, missing words, translations and grammar. Surahs with more than {QUIZ_PART} ayahs are split into parts. Each quiz has {QUIZ_LEN} questions, freshly mixed every time.</div></section>
      <input id="qq" value={q} onChange={e => setQ(e.target.value)} placeholder="Find a surah…" className="mb-3 w-full rounded-full border border-line bg-surface px-3.5 py-2 text-ink outline-none focus:border-brand" />
      <div className={`${grid} items-start`} id="qlist">
        {surahs.filter(x => !qq || String(x.n) === qq || x.en.toLowerCase().replace(/[^a-z]/g, '').includes(qq)).map(x => {
          const parts = quizParts(x.ayahs);
          return (
            <div key={x.n} className={`${card} flex flex-col px-3.5 py-3`}>
              <div className="flex items-center gap-3"><div className={numBadge}>{x.n}</div>
                <div className="min-w-0 flex-1"><b className="block text-[15px]">{x.en}</b><span className="text-[12.5px] text-muted">{x.ayahs} ayahs · {parts.length} quiz{parts.length > 1 ? 'zes' : ''}</span></div>
                <div className="font-amiri text-[22px] text-brand" dir="rtl">{x.ar.replace(/^سُورَةُ\s*/, '')}</div></div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {parts.map(([f, t], i) => <Link key={i} href={`/quiz/${x.n}/${i + 1}`} className="rounded-full border border-line bg-surface px-2.5 py-1 text-[12.5px] text-ink no-underline hover:border-brand hover:text-brand">{parts.length > 1 ? `Part ${i + 1} · ` : 'Start · '}{f}–{t}</Link>)}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
