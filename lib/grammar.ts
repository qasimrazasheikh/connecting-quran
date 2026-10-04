/** Turns Quranic Arabic Corpus tags into readable English + Arabic grammar labels. */
import type {MSeg} from './quran';
export const POS_NAME: Record<string, [string, string]> = {N:['Noun','اسم'], V:['Verb','فعل'], P:['Particle','حرف']};
const TAG: Record<string, [string, string]> = {
  PN:['Proper noun','علم'], ADJ:['Adjective','صفة'], PRON:['Pronoun','ضمير'], DEM:['Demonstrative pronoun','اسم إشارة'], REL:['Relative pronoun','اسم موصول'],
  T:['Time adverb','ظرف زمان'], LOC:['Location adverb','ظرف مكان'], IMPN:['Imperative verbal noun','اسم فعل أمر'],
  DET:['Definite article (al-)','أداة تعريف'], P:['Preposition','حرف جر'], CONJ:['Coordinating conjunction','حرف عطف'], SUB:['Subordinating conjunction','حرف مصدري'],
  NEG:['Negative particle','حرف نفي'], INTG:['Interrogative particle','حرف استفهام'], VOC:['Vocative particle','حرف نداء'], EMPH:['Emphatic particle (lām)','لام التوكيد'],
  IMPV:['Imperative particle','لام الأمر'], PRP:['Purpose particle','لام التعليل'], RES:['Restriction particle','أداة حصر'], ACC:['Accusative particle (inna group)','حرف نصب'],
  COND:['Conditional particle','حرف شرط'], ANS:['Answer particle','حرف جواب'], AVR:['Aversion particle','حرف ردع'], CERT:['Particle of certainty','حرف تحقيق'],
  RET:['Retraction particle','حرف اضراب'], PREV:['Preventive particle','كافة'], EXP:['Exceptive particle','أداة استثناء'], SUP:['Supplemental particle','حرف زائد'],
  SUR:['Surprise particle','حرف فجاءة'], INC:['Inceptive particle','حرف ابتداء'], AMD:['Amendment particle','حرف استدراك'], EXL:['Explanation particle','حرف تفصيل'],
  FUT:['Future particle','حرف استقبال'], REM:['Resumption particle','حرف استئنافية'], CIRC:['Circumstantial particle','حرف حال'], EQ:['Equalization particle','حرف تسوية'],
  INL:['Quranic initials','حروف مقطعة'], CAUS:['Particle of cause','حرف سببية'], COM:['Comitative particle','واو المعية'], RSLT:['Result particle','حرف واقع في جواب الشرط'],
  EXH:['Exhortation particle','حرف تحضيض'], INT:['Particle of interpretation','حرف تفسير'], PRO:['Prohibition particle','حرف نهي'],
  PERF:['Perfect verb (past)','فعل ماض'], IMPF:['Imperfect verb (present/future)','فعل مضارع'], PASS:['Passive voice','مبني للمجهول'],
  NOM:['Nominative','مرفوع'], GEN:['Genitive','مجرور'], INDEF:['Indefinite','نكرة'],
  ACT_PCPL:['Active participle','اسم فاعل'], PASS_PCPL:['Passive participle','اسم مفعول'], VN:['Verbal noun','مصدر'],
  SUBJ:['Subjunctive mood','منصوب'], JUS:['Jussive mood','مجزوم'], IND:['Indicative mood','مرفوع'],
  PREF:['Prefix','سابقة'], SUFF:['Suffix','لاحقة'],
};
const PERSON: Record<string, string> = {'1':'1st person','2':'2nd person','3':'3rd person'}, GENDER: Record<string, string> = {M:'masculine', F:'feminine'}, NUMBER: Record<string, string> = {S:'singular', D:'dual', P:'plural'};
const roman = (n: string) => ['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'][+n] || n;
function pgn(x: string){
  if (x === 'P' || !x) return '';
  const m = /^([123])?([MF])?([SDP])?$/.exec(x);
  if (!m || (!m[1] && !m[2] && !m[3])) return '';
  return [PERSON[m[1]], GENDER[m[2]], NUMBER[m[3]]].filter(Boolean).join(', ');
}
/** Labels use "English — عربي"; the client keeps the two directions apart when rendering. */
export type SegInfo = {text: string; pos: string; name: string; details: string[]; root: string; lemma: string};
export function describeSeg(seg: MSeg): SegInfo {
  const out: SegInfo = {text: seg.text, pos: seg.pos, name: '', details: [], root: '', lemma: ''};
  const t = seg.tags.slice(), isVerb = seg.pos === 'V';
  let mainSet = false;
  for (let i = 0; i < t.length; i++){
    let x = t[i];
    if (x.startsWith('ROOT:')){ out.root = x.slice(5); continue; }
    if (x.startsWith('LEM:')){ out.lemma = x.slice(4); continue; }
    if (x.startsWith('PRON:')){ const g = pgn(x.slice(5)); out.details.push(`Pronoun${g ? ' — ' + g : ''}`); if (!mainSet){ out.name = 'Attached pronoun'; mainSet = true; } continue; }
    if (x.startsWith('MOOD:')) x = x.slice(5);
    if (x.startsWith('SP:')){ out.details.push(`Special group: ${x.slice(3)}`); continue; }
    if (x.startsWith('VF:')){ out.details.push(`Verb form ${roman(x.slice(3))}`); continue; }
    if (/^\((I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)\)$/.test(x)){ out.details.push(`Verb form ${x.slice(1, -1)}`); continue; }
    if (x === 'ACT' && t[i + 1] === 'PCPL'){ x = 'ACT_PCPL'; i++; } else if (x === 'PASS' && t[i + 1] === 'PCPL'){ x = 'PASS_PCPL'; i++; }
    if (x === 'ACC' && seg.pos === 'N'){ out.details.push('Accusative — منصوب'); continue; }
    if (x === 'IMPV' && isVerb){ if (!mainSet){ out.name = 'Imperative verb — فعل أمر'; mainSet = true; } continue; }
    const g = pgn(x); if (g){ out.details.push(g); continue; }
    if (TAG[x]){
      const [en, ar] = TAG[x];
      const secondary = ['NOM','GEN','INDEF','PASS','SUBJ','JUS','IND','PREF','SUFF'].includes(x);
      if (!mainSet && !secondary){ out.name = `${en} — ${ar}`; mainSet = true; } else out.details.push(`${en} — ${ar}`);
      continue;
    }
    out.details.push(x);
  }
  if (!mainSet){ const p = POS_NAME[seg.pos]; out.name = p ? `${p[0]} — ${p[1]}` : seg.pos; }
  return out;
}
