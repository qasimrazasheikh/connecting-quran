/**
 * A justified right-to-left paragraph in a Nastaliq (or Naskh) font, for tafseer notes.
 *
 * Nastaliq letters such as initial ک draw a little beyond their own advance, and an Android TextView clips whatever is
 * drawn outside its box. Justified, every line touches both edges, so the first letter of a line lost its right side
 * (and a long final ے could lose its tail on the left). So the paragraph is first laid out with a little room on each
 * side, only to find where its lines break; it is then drawn full width with a narrow no-break space at both ends of
 * every line. The lines break exactly as measured, and the overhanging strokes fall inside the box.
 *
 * As in JustifiedRtl, Android maps "justify" to left gravity for the last line, so that line is drawn invisibly in the
 * paragraph and a right-aligned copy is laid over it.
 */
import {useState} from 'react';
import {Platform, Text, View, type TextStyle} from 'react-native';

const PAD = ' ';
/** Android ignores 'transparent' text colour (see JustifiedRtl), so the hidden line gets an alpha of 1/255. */
const INVISIBLE = '#00000001';
/** Puts PAD at both ends of a line, keeping the line's trailing space (where it breaks) after it. */
const padLine = (l: string) => { const m = l.match(/^([\s\S]*?)(\s*)$/)!; return PAD + m[1] + PAD + m[2]; };

export default function JustifiedNastaliq({text, style}: {text: string; style: TextStyle}){
  const sig = `${style.fontSize}|${style.fontFamily}|${text}`;
  // Where each line starts, measured with the side room (null until measured)
  const [m, setM] = useState<{sig: string; starts: number[]} | null>(null);
  if (Platform.OS !== 'android') return <Text style={[style, {textAlign: 'justify', writingDirection: 'rtl'}]}>{text}</Text>;

  const starts = m?.sig === sig ? m.starts : null;
  // Room for two no-break spaces: a generous half em, so a line never grows past what was measured
  const room = Math.ceil((style.fontSize ?? 16) * 0.5);
  if (!starts) return (
    <Text style={[style, {textAlign: 'justify', paddingHorizontal: room}]} onTextLayout={e => {
      const lines = e.nativeEvent.lines, at: number[] = [];
      let pos = 0;
      for (const l of lines){ at.push(pos); pos += l.text.length; }
      // only when the line report adds up to the text (otherwise this measured layout simply stays)
      if (pos === text.length) setM({sig, starts: at});
    }}>{text}</Text>
  );

  const lines = starts.map((s, i) => padLine(text.slice(s, starts[i + 1] ?? text.length)));
  const last = lines.pop()!;
  return (
    <View>
      <Text style={[style, {textAlign: 'justify'}]}>{lines.join('')}<Text style={{color: INVISIBLE}}>{last}</Text></Text>
      <Text style={[style, {textAlign: 'right', position: 'absolute', left: 0, right: 0, bottom: 0}]}>{last}</Text>
    </View>
  );
}
