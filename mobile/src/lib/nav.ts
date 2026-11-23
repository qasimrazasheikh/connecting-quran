import {router} from 'expo-router';

/** Opens the reader at a surah, optionally scrolled to an ayah. */
export const openAyah = (s: number, a?: number) => router.push({pathname: '/surah/[n]', params: a ? {n: s, a} : {n: s}});
