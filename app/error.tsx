'use client';
import {btn, empty} from '@/lib/ui';
export default function Error({error, reset}: {error: Error; reset: () => void}) {
  return <div className={empty}><b className="mb-2 block text-lg text-ink">Something went wrong</b><p>{error.message}</p><button className={btn} onClick={reset}>Try again</button></div>;
}
