/**
 * Justified right-to-left paragraph. React Native on Android maps "justify" to left gravity, so a justified Arabic
 * paragraph ends with its last line on the left. Here the paragraph is laid out justified once, with its last line
 * transparent (so every line breaks and stretches exactly as before), and a right-aligned copy of that last line is
 * laid over it. Elsewhere plain "justify" already does the right thing.
 */
import {useState, type ReactNode} from 'react';
import {Platform, Text, View, type GestureResponderEvent, type TextStyle} from 'react-native';

/** `onLongPress` gets the touch, so callers can place a popover where the finger is. */
export type Seg = {key: string; text: string; style?: TextStyle; onPress?: () => void; onLongPress?: (e: GestureResponderEvent) => void};

/** Splits segments at a character offset; a segment that straddles it becomes two pieces with the same props. */
function cut(segs: Seg[], at: number): [Seg[], Seg[]] {
  const a: Seg[] = [], b: Seg[] = [];
  let pos = 0;
  for (const s of segs){
    const end = pos + s.text.length;
    if (end <= at) a.push(s);
    else if (pos >= at) b.push(s);
    else { a.push({...s, text: s.text.slice(0, at - pos)}); b.push({...s, key: s.key + '~', text: s.text.slice(at - pos)}); }
    pos = end;
  }
  return [a, b];
}
/** Android reads the colour 0 ('transparent') as "no colour set" and draws the text in the inherited colour, so the
 *  hidden copy gets an alpha of 1/255 instead: invisible, but not zero. */
const INVISIBLE = '#00000001';
const show = (segs: Seg[], hidden?: boolean): ReactNode => segs.map(s => hidden
  ? <Text key={s.key} style={[s.style, {color: INVISIBLE, backgroundColor: INVISIBLE}]}>{s.text}</Text>
  : <Text key={s.key} style={s.style} onPress={s.onPress} onLongPress={s.onLongPress}>{s.text}</Text>);

export default function JustifiedRtl({segs, style}: {segs: Seg[]; style: TextStyle}){
  const full = segs.map(s => s.text).join('');
  // Where the last line starts, for this exact text and size (null until measured, or when the line report doesn't add up)
  const [last, setLast] = useState<{sig: string; at: number | null}>({sig: '', at: null});
  const sig = `${style.fontSize}|${full}`;

  if (Platform.OS !== 'android') return <Text style={[style, {textAlign: 'justify', writingDirection: 'rtl'}]}>{show(segs)}</Text>;

  const at = last.sig === sig ? last.at : null;
  const [body, tail] = at === null ? [segs, []] : cut(segs, at);
  return (
    <View>
      <Text style={[style, {textAlign: 'justify'}]} onTextLayout={e => {
        const lines = e.nativeEvent.lines, total = lines.reduce((n, l) => n + l.text.length, 0);
        const start = total === full.length ? total - lines[lines.length - 1].text.length : null;
        if (last.sig !== sig || last.at !== start) setLast({sig, at: start});
      }}>
        {show(body)}{show(tail, true)}
      </Text>
      {tail.length > 0 && <Text style={[style, {textAlign: 'right', position: 'absolute', left: 0, right: 0, bottom: 0}]}>{show(tail)}</Text>}
    </View>
  );
}
