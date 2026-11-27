/** Small shared pieces: icons, text styles, buttons, the bottom-sheet frame and the top bar. */
import {router} from 'expo-router';
import type {ReactNode} from 'react';
import {Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Circle, Path} from 'react-native-svg';
import {useApp} from '@/lib/store';
import {F} from '@/lib/theme';

const P = {
  book: 'M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5ZM12 6.5v13',
  mushaf: 'M6 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6zM6 3v18M10 8h5M10 12h5',
  tafseer: 'M4 5h16v11H9l-5 4zM8 9h8M8 12h5',
  search: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14ZM20 20l-3.5-3.5',
  bookmark: 'M6 3h12v18l-6-4-6 4z',
  back: 'm15 18-6-6 6-6', fwd: 'm9 18 6-6-6-6', down: 'm6 9 6 6 6-6', x: 'M6 6l12 12M18 6 6 18',
  sliders: 'M4 7h10M18 7h2M4 17h2M10 17h10M16 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM8 15a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z',
  headphones: 'M3 14v-2a9 9 0 0 1 18 0v2M21 16a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2zM3 16a2 2 0 0 0 2 2h1v-6H5a2 2 0 0 0-2 2z',
  repeat: 'M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1', share: 'M12 3v12M7 8l5-5 5 5M5 14v6h14v-6',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  lines: 'M4 7h16M4 12h10M4 17h7', speaker: 'M11 5 6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13',
  arrow: 'M5 12h14M13 6l6 6-6 6', check: 'm5 12 5 5 9-10', compare: 'M4 5h7v14H4zM13 5h7v14h-7z', phone: 'M7 2h10v20H7zM11 18h2',
};
const FILLED = {
  play: 'M8 5.5v13l11-6.5z', pause: 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z',
  next: 'M5 5.5v13l9-6.5zM16 5h3v14h-3z', prev: 'M19 5.5v13L10 12zM5 5h3v14H5z',
};
export type IconName = keyof typeof P | keyof typeof FILLED | 'more';

export function Icon({name, size = 22, color, fill, stroke = 1.8}: {name: IconName; size?: number; color: string; fill?: string; stroke?: number}){
  if (name === 'more') return (
    <Svg width={size} height={size} viewBox="0 0 24 24">{[5, 12, 19].map(x => <Circle key={x} cx={x} cy={12} r={1.8} fill={color} />)}</Svg>
  );
  if (name in FILLED) return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d={FILLED[name as keyof typeof FILLED]} fill={color} /></Svg>;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={P[name as keyof typeof P]} fill={fill ?? 'none'} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** UI text in Inter; `w` picks the weight, `c` the colour token. */
export function T({children, size = 15, w = 'r', c, style, lines}: {children: ReactNode; size?: number; w?: 'r' | 'm' | 'sb' | 'b'; c?: string; style?: StyleProp<TextStyle>; lines?: number}){
  const {t} = useApp();
  return <Text numberOfLines={lines} style={[{fontFamily: F[w], fontSize: size, color: c ?? t.text, lineHeight: Math.round(size * 1.45)}, style]}>{children}</Text>;
}

export function Btn({label, icon, onPress, ghost, style, small}: {label: string; icon?: IconName; onPress?: () => void; ghost?: boolean; style?: StyleProp<ViewStyle>; small?: boolean}){
  const {t} = useApp();
  const fg = ghost ? t.brand : t.onBrand;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({pressed}) => [{
      height: small ? 40 : 48, paddingHorizontal: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: ghost ? 'transparent' : t.brand, borderWidth: ghost ? 1.5 : 0, borderColor: t.brand, opacity: pressed ? 0.75 : 1,
    }, style]}>
      {icon && <Icon name={icon} size={18} color={fg} />}
      <T w="sb" size={small ? 14 : 15} c={fg}>{label}</T>
    </Pressable>
  );
}

export function IconBtn({name, onPress, label, color, bordered, size = 44}: {name: IconName; onPress?: () => void; label: string; color?: string; bordered?: boolean; size?: number}){
  const {t} = useApp();
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} accessibilityRole="button" hitSlop={4} style={({pressed}) => ({
      width: size, height: size, borderRadius: 12, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1,
      ...(bordered ? {borderWidth: 1, borderColor: t.line, backgroundColor: t.surface} : {}),
    })}>
      <Icon name={name} color={color ?? t.text} size={20} />
    </Pressable>
  );
}

export function Chip({label, on, onPress, font}: {label: string; on?: boolean; onPress?: () => void; font?: string}){
  const {t} = useApp();
  return (
    <Pressable onPress={onPress} style={{height: 36, paddingHorizontal: 14, borderRadius: 999, justifyContent: 'center', backgroundColor: on ? t.brand : t.surface,
      borderWidth: on ? 0 : 1, borderColor: t.line}}>
      <Text style={{fontFamily: font ?? (on ? F.sb : F.m), fontSize: font ? 17 : 13, color: on ? t.onBrand : t.text, includeFontPadding: false}}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<V extends string>({value, options, onChange}: {value: V; options: {v: V; label: string}[]; onChange: (v: V) => void}){
  const {t} = useApp();
  return (
    <View style={{flexDirection: 'row', borderWidth: 1, borderColor: t.line, borderRadius: 12, overflow: 'hidden', backgroundColor: t.surface}}>
      {options.map(o => (
        <Pressable key={o.v} onPress={() => onChange(o.v)} style={{flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: o.v === value ? t.brand : 'transparent'}}>
          <T size={14} w={o.v === value ? 'sb' : 'm'} c={o.v === value ? t.onBrand : t.text}>{o.label}</T>
        </Pressable>
      ))}
    </View>
  );
}

/** Screen title row for the tab screens, with the settings button. */
export function TabHeader({title}: {title: string}){
  const {t} = useApp();
  return (
    <View style={{flexDirection: 'row', alignItems: 'center', paddingTop: 8}}>
      <T size={26} w="b" style={{flex: 1, letterSpacing: -0.4, lineHeight: 34}}>{title}</T>
      <IconBtn name="sliders" label="Settings" bordered onPress={() => router.push('/settings')} color={t.text} />
    </View>
  );
}

/** Back button + title for pushed screens; with `onTitle` the title is a button (with a ▾) that opens a picker. */
export function TopBar({title, sub, right, onTitle}: {title: string; sub?: string; right?: ReactNode; onTitle?: () => void}){
  const {t} = useApp();
  const insets = useSafeAreaInsets();
  return (
    <View style={{paddingTop: insets.top + 4, paddingHorizontal: 6, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 2,
      backgroundColor: t.bg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.line}}>
      <IconBtn name="back" label="Back" onPress={() => router.back()} />
      <Pressable disabled={!onTitle} accessibilityLabel={onTitle ? `${title}, choose surah and ayah` : undefined} onPress={onTitle} style={{flex: 1}}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
          <T size={17} w="b" lines={1} style={{flexShrink: 1}}>{title}</T>
          {onTitle && <Icon name="down" size={18} color={t.brand} stroke={2.2} />}
        </View>
        {sub ? <T size={12} c={t.muted}>{sub}</T> : null}
      </Pressable>
      {right}
    </View>
  );
}

/** Frame for screens shown as bottom sheets (transparent modal): tap the dimmed area to close. */
export function Sheet({children, label}: {children: ReactNode; label: string}){
  const {t} = useApp();
  const insets = useSafeAreaInsets();
  return (
    <View style={{flex: 1, justifyContent: 'flex-end'}}>
      <Pressable accessibilityLabel="Close" onPress={() => router.back()} style={[StyleSheet.absoluteFill, {backgroundColor: 'rgba(11,13,29,0.45)'}]} />
      <View accessibilityLabel={label} style={{backgroundColor: t.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18,
        paddingTop: 10, paddingBottom: insets.bottom + 18, gap: 16, maxHeight: '88%'}}>
        <View style={{alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: t.line}} />
        {children}
      </View>
    </View>
  );
}

export function Badge({label}: {label: string}){
  const {t} = useApp();
  return (
    <View style={{height: 26, paddingHorizontal: 9, borderRadius: 8, backgroundColor: t.soft, justifyContent: 'center'}}>
      <T size={12.5} w="sb" c={t.brand}>{label}</T>
    </View>
  );
}
