/**
 * Tafseer for one ayah, read live from connectingquran.com's API (the same notes the website shows). Any of the site's
 * works can be chosen (the picker screen); the last few chosen stay as chips here. The ayah header stays at the top
 * (surah and ayah picker, previous / next); the bar at the bottom sizes, copies and opens Settings.
 */
import * as Clipboard from 'expo-clipboard';
import {router} from 'expo-router';
import {useEffect, useState} from 'react';
import {ActivityIndicator, Pressable, ScrollView, Text, View} from 'react-native';
import {tafsirFont, useChooseTafsir} from '@/app/tafsirs';
import {getQoh, getTafsir, SITE, useMeta, type QohItem} from '@/lib/api';
import {endMark, stepAyah, surahInfo, useSurah} from '@/lib/data';
import {useApp} from '@/lib/store';
import {F} from '@/lib/theme';
import {arFont, arText, TransText} from './AyahCard';
import GoToAyah from './GoToAyah';
import JustifiedNastaliq from './JustifiedNastaliq';
import {Chip, Icon, IconBtn, T, type IconName} from './ui';

/** The API returns plain text, sometimes with simple HTML; keep the paragraphs. */
const plain = (h: string) => h.replace(/<br\s*\/?>|<\/p>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\n{3,}/g, '\n\n').trim();
/**
 * Urdu and Arabic notes are justified like a printed page, one paragraph at a time (JustifiedNastaliq keeps each last line on
 * the right). Android ignores writingDirection and takes a paragraph's direction from its first strong letter, so each
 * starts with a right-to-left mark: one opening with a bracket or number would otherwise be laid out left-to-right.
 */
const rtlParas = (text: string) => text.split('\n').map(l => l.trim()).map(l => l && '‏' + l);

export default function TafseerView({s, a, onGo, top}: {s: number; a: number; onGo: (s: number, a: number) => void; top?: number}){
  const {t, settings: st, set} = useApp();
  const meta = useMeta(), choose = useChooseTafsir();
  const [tab, setTab] = useState<'tafseer' | 'videos'>('tafseer');
  const [picking, setPicking] = useState(false);
  const [copied, setCopied] = useState('');
  const cur = meta.tafsirs.find(x => x.slug === st.tafsir) ?? meta.tafsirs[0];
  const quick = [cur.slug, ...st.tafsirs].filter((x, i, l) => l.indexOf(x) === i).map(x => meta.tafsirs.find(m => m.slug === x)).filter(x => !!x);
  const [res, setRes] = useState<{key: string; text?: string; items?: QohItem[]; error?: string}>({key: ''});
  const key = `${cur.slug}/${s}/${a}`;
  const ayah = useSurah(s)?.[a - 1], total = surahInfo(s).ayahs;
  const prev = stepAyah(s, a, -1), next = stepAyah(s, a, 1);

  useEffect(() => {
    let live = true;
    const failed = () => live && setRes({key, error: 'Could not reach connectingquran.com. Check the connection.'});
    if (cur.route === 'qoh') getQoh(s, a).then(items => live && setRes({key, items: items.map(x => ({...x, text: plain(x.text)}))}), failed);
    else getTafsir(cur.slug, s, a).then(d => live && setRes({key, text: d.text ? plain(d.text) : undefined, error: d.error}), failed);
    return () => { live = false; };
  }, [key, cur.route, cur.slug, s, a]);

  const rtl = cur.lang !== 'english', z = st.tafSize, rz = z + 4;
  const rtlStyle = {fontFamily: tafsirFont(cur.lang), fontSize: rz, lineHeight: Math.round(rz * 2.3), color: t.text, includeFontPadding: false} as const;
  const body = (text: string) => rtl
    ? <View>{rtlParas(text).map((p, i) => p ? <JustifiedNastaliq key={i} style={rtlStyle} text={p} /> : <View key={i} style={{height: rz * 0.8}} />)}</View>
    : <Text selectable style={{fontFamily: F.r, fontSize: z, lineHeight: Math.round(z * 1.6), color: t.text}}>{text}</Text>;
  const title = (name: string, author: string) => (
    <View style={{flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap'}}>
      <Text style={{fontFamily: rtl ? tafsirFont(cur.lang) : F.b, fontSize: rtl ? 20 : 16, lineHeight: rtl ? 40 : 22, color: t.brand2, includeFontPadding: false}}>{name}</Text>
      <Text style={{fontFamily: rtl ? tafsirFont(cur.lang) : F.r, fontSize: rtl ? 15 : 13, lineHeight: rtl ? 32 : 18, color: t.muted, includeFontPadding: false}}>{author}</Text>
    </View>
  );

  // Copy: the note(s) on screen, with the work, the ayah and a link back
  const notes = res.key !== key ? [] : res.items ? res.items.map(x => `${x.name} — ${x.author}\n${x.text}`) : res.text ? [`${cur.name} — ${cur.author}\n${res.text}`] : [];
  const copy = () => {
    if (!notes.length) return;
    Clipboard.setStringAsync(`${notes.join('\n\n')}\n\n${surahInfo(s).en} ${s}:${a} · ${SITE}/tafseer/${s}/${a}`).then(() => setCopied(key));
  };
  const barBtn = (icon: IconName | null, label: string, onPress: () => void, text?: string, disabled?: boolean) => (
    <Pressable accessibilityLabel={label} onPress={onPress} disabled={disabled} style={{flex: 1, height: 46, borderRadius: 12, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center',
      backgroundColor: t.soft, opacity: disabled ? 0.4 : 1}}>
      {icon && <Icon name={icon} size={18} color={t.brand} />}{text ? <T size={14} w="sb" c={t.brand}>{text}</T> : null}
    </Pressable>
  );

  return (
    <View style={{flex: 1}}>
      <View style={{paddingHorizontal: 12, paddingTop: top ?? 8, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: t.bg, borderBottomWidth: 1, borderBottomColor: t.line}}>
        <Pressable accessibilityLabel="Choose surah and ayah" onPress={() => setPicking(true)} style={{flex: 1}}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
            <T size={17} w="b" lines={1} style={{flexShrink: 1}}>{surahInfo(s).en} {s}:{a}</T>
            <Icon name="down" size={18} color={t.brand} stroke={2.2} />
          </View>
          <T size={12} c={t.muted}>Tafseer · ayah {a} of {total}</T>
        </Pressable>
        <IconBtn name="back" label="Previous ayah" bordered onPress={() => prev && onGo(prev.s, prev.a)} />
        <IconBtn name="fwd" label="Next ayah" bordered onPress={() => next && onGo(next.s, next.a)} />
      </View>

      <ScrollView contentContainerStyle={{padding: 12, gap: 12, paddingBottom: 150}}>
        <View style={{flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: t.line}}>
          {(['tafseer', 'videos'] as const).map(x => (
            <Pressable key={x} onPress={() => setTab(x)} style={{flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2.5, borderBottomColor: tab === x ? t.brand : '#00000001'}}>
              <T size={14} w={tab === x ? 'sb' : 'm'} c={tab === x ? t.brand : t.muted}>{x === 'tafseer' ? 'Tafseer' : 'Videos'}</T>
            </Pressable>
          ))}
        </View>

        {ayah && <View style={{padding: 12, borderRadius: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, gap: 2}}>
          <Text style={{fontFamily: arFont(st), fontSize: 24, lineHeight: 52, color: t.text, textAlign: 'right', includeFontPadding: false}}>
            {arText(ayah, st)} <Text style={{fontFamily: F.uth, color: t.mark}}>{endMark(a)}</Text>
          </Text>
          <TransText s={s} ayah={ayah} size={15} />
        </View>}

        {tab === 'videos' ? (
          <View style={{padding: 24, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: t.line, alignItems: 'center'}}>
            <T c={t.muted} style={{textAlign: 'center'}}>Video lectures come in version 1.1. On the website they are already in the Study panel.</T>
          </View>
        ) : <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 8, alignItems: 'center'}}>
            {quick.map(x => <Chip key={x.slug} label={x.name} font={x.lang === 'english' ? undefined : tafsirFont(x.lang)} on={x.slug === cur.slug} onPress={() => choose(x.slug)} />)}
            <Chip label={`All tafseers (${meta.tafsirs.length}) ›`} onPress={() => router.push('/tafsirs')} />
          </ScrollView>
          {cur.route === 'qoh' && res.key === key && res.items
            ? res.items.length ? res.items.map(x => (
                <View key={x.name} style={{padding: 16, borderRadius: 16, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, gap: 10}}>
                  {title(x.name, x.author)}{body(x.text)}
                </View>))
              : <T c={t.muted}>No notes for this ayah here.</T>
            : <View style={{padding: 16, borderRadius: 16, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, gap: 10}}>
              {title(cur.name, cur.author)}
              {res.key !== key ? <ActivityIndicator color={t.brand} style={{padding: 30}} />
                : res.text ? body(res.text)
                : <T c={t.muted}>{res.error || 'No tafseer for this ayah in this work.'}</T>}
            </View>}
        </>}
      </ScrollView>

      <View style={{position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 8, padding: 10, backgroundColor: t.surface, borderTopWidth: 1, borderTopColor: t.line}}>
        {barBtn(null, 'Smaller tafseer text', () => set({tafSize: Math.max(12, z - 2)}), 'A−', z <= 12)}
        {barBtn(null, 'Larger tafseer text', () => set({tafSize: Math.min(30, z + 2)}), 'A+', z >= 30)}
        {barBtn(copied === key ? 'check' : 'copy', 'Copy tafseer', copy, copied === key ? 'Copied' : 'Copy', !notes.length)}
        {barBtn('sliders', 'Settings', () => router.push('/settings'))}
      </View>
      <GoToAyah visible={picking} s={s} a={a} onPick={onGo} onClose={() => setPicking(false)} />
    </View>
  );
}
