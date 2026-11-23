/** Colour tokens: the website's three palettes × light/dark (app/globals.css), plus the app's own extras. */
export type Palette = 'midnight' | 'classic' | 'ocean';
export type Theme = {
  dark: boolean; bg: string; surface: string; surface2: string; text: string; muted: string; line: string;
  brand: string; brand2: string; accent: string; soft: string; onBrand: string; hero: string; heroText: string; heroMuted: string;
  /** Ayah-end signs and bookmarks: the accent, darkened on light backgrounds so it still reads */
  mark: string; player: string; playerText: string; playerMuted: string; highlight: string;
};

const T: Record<Palette, {light: Theme; dark: Theme}> = {
  midnight: {
    light: {dark: false, bg: '#f4f5fb', surface: '#ffffff', surface2: '#eef0f8', text: '#141833', muted: '#5d6482', line: '#e2e5f1',
      brand: '#3d3fc4', brand2: '#24267f', accent: '#e5a619', soft: '#ebedfe', onBrand: '#ffffff', hero: '#1b1d5e', heroText: '#e9ebf8', heroMuted: '#c6cbff',
      mark: '#c9a227', player: '#131731', playerText: '#e9ebf8', playerMuted: '#a2a8c6', highlight: '#fdf1cf'},
    dark: {dark: true, bg: '#0b0d1d', surface: '#131731', surface2: '#1a1f3f', text: '#e9ebf8', muted: '#a2a8c6', line: '#262c52',
      brand: '#9ea8ff', brand2: '#c6cbff', accent: '#f4c04e', soft: '#1f2552', onBrand: '#0b0d1d', hero: '#141649', heroText: '#e9ebf8', heroMuted: '#c6cbff',
      mark: '#f4c04e', player: '#1a1f3f', playerText: '#e9ebf8', playerMuted: '#a2a8c6', highlight: '#3a3420'},
  },
  classic: {
    light: {dark: false, bg: '#f7f5ef', surface: '#ffffff', surface2: '#f0ede4', text: '#1f2a24', muted: '#66706a', line: '#e2ddd0',
      brand: '#0f6b4f', brand2: '#0b5139', accent: '#b8892b', soft: '#e3f1ea', onBrand: '#ffffff', hero: '#0b5139', heroText: '#eef6f2', heroMuted: '#bfe0d1',
      mark: '#a87a1f', player: '#16241d', playerText: '#e7ece9', playerMuted: '#9aa59f', highlight: '#f6ecd0'},
    dark: {dark: true, bg: '#121815', surface: '#1a221e', surface2: '#222c27', text: '#e7ece9', muted: '#9aa59f', line: '#2d3833',
      brand: '#46b98d', brand2: '#6fd0aa', accent: '#d9ae55', soft: '#1d3229', onBrand: '#0d1a14', hero: '#123a2c', heroText: '#e7ece9', heroMuted: '#a9d9c3',
      mark: '#d9ae55', player: '#222c27', playerText: '#e7ece9', playerMuted: '#9aa59f', highlight: '#3a3320'},
  },
  ocean: {
    light: {dark: false, bg: '#f3f8fa', surface: '#ffffff', surface2: '#e9f2f5', text: '#0f2530', muted: '#557079', line: '#dbe8ed',
      brand: '#0b7a99', brand2: '#0b4f6c', accent: '#f2683c', soft: '#e1f3f8', onBrand: '#ffffff', hero: '#063d55', heroText: '#e4f1f5', heroMuted: '#a6e8f4',
      mark: '#d2552b', player: '#0f222b', playerText: '#e4f1f5', playerMuted: '#93b0b9', highlight: '#fde4d8'},
    dark: {dark: true, bg: '#08161c', surface: '#0f222b', surface2: '#15303b', text: '#e4f1f5', muted: '#93b0b9', line: '#1f3d49',
      brand: '#5ccfe6', brand2: '#a6e8f4', accent: '#ff8a5c', soft: '#123744', onBrand: '#07141a', hero: '#052f42', heroText: '#e4f1f5', heroMuted: '#a6e8f4',
      mark: '#ff8a5c', player: '#15303b', playerText: '#e4f1f5', playerMuted: '#93b0b9', highlight: '#3d2a20'},
  },
};
export const theme = (p: Palette, dark: boolean): Theme => T[p][dark ? 'dark' : 'light'];
export const PALETTES: {id: Palette; name: string}[] = [{id: 'midnight', name: 'Midnight'}, {id: 'classic', name: 'Classic'}, {id: 'ocean', name: 'Ocean'}];

/** Font family names as registered in the root layout. */
export const F = {
  r: 'Inter_400Regular', m: 'Inter_500Medium', sb: 'Inter_600SemiBold', b: 'Inter_700Bold',
  ip: 'IndoPak', uth: 'UthmanicHafs', ur: 'MehrNastaliq', names: 'SurahNames',
};
