'use client';
import {Fragment} from 'react';
import {useApp} from './AppProvider';
import {IP_END, type Tok, type WordItem} from '@/lib/text';
import {arNum} from '@/lib/meta';
import {cx} from '@/lib/ui';

const TokView = ({t}: {t: Tok}) => <>{t.segs.map((sg, i) => sg.c ? <span key={i} className={`tj-${sg.c}`}>{sg.t}</span> : <Fragment key={i}>{sg.t}</Fragment>)}</>;

/** Arabic text of one ayah as tappable words (tap = grammar card), with optional tajweed colours and word-by-word meanings. */
export default function AyahText({s, a, words, wbw, className, endmark = true, onAyah}: {
  s: number; a: number; words: WordItem[]; wbw: boolean; className?: string; endmark?: boolean; onAyah?: () => void;
}) {
  const {word, openWord, closeWord} = useApp();
  const selN = word && word.s === s && word.a === a ? (word.w || word.t) : 0;
  // Indo-Pak Nastaleeq text carries its own ayah-end marker (drawn by the font), so skip ours
  const last = words[words.length - 1], ownEnd = last?.k === 'x' && IP_END.test(last.tok.text);
  return (
    <span className={cx('q-ar', wbw && 'wbw', className)}>
      {words.map((it, i) => {
        const sp = i ? ' ' : '';
        if (it.k === 'x') return <Fragment key={i}>{sp}<TokView t={it.tok} /></Fragment>;
        const on = selN === it.n;
        return (
          <Fragment key={i}>{sp}<span className={cx('w', on && 'wsel')} {...(it.byToken ? {'data-t': it.n} : {'data-w': it.n})}
            onClick={e => {
              e.stopPropagation();
              if (on){ closeWord(); return; }
              const text = it.toks.map(t => t.text).join(' ');
              const el = e.currentTarget as HTMLElement;
              openWord({s, a, ...(it.byToken ? {t: it.n} : {w: it.n}), text, font: getComputedStyle(el).fontFamily, rect: el.getBoundingClientRect(), onAyah});
            }}>
            <span className="wa">{it.toks.map((t, j) => <Fragment key={j}>{j ? ' ' : ''}<TokView t={t} /></Fragment>)}</span>
            {wbw && it.m && <span className="wm" dir="auto">{it.m}</span>}
          </span></Fragment>
        );
      })}
      {endmark && !ownEnd && <> <span className="endmark">﴿{arNum(a)}﴾</span></>}
    </span>
  );
}
