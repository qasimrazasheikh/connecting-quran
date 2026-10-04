import {getTafsirEditions, getTransEditions} from '@/lib/quran';
import {NextResponse} from 'next/server';
export async function GET() {
  const [trans, tafsir] = await Promise.all([getTransEditions(), getTafsirEditions()]);
  return NextResponse.json({trans, tafsir}, {headers: {'Cache-Control': 'public, s-maxage=86400'}});
}
