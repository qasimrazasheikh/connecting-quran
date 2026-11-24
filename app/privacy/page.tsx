import {card, h4} from '@/lib/ui';
import {seo} from '@/lib/seo';

export const metadata = seo('/privacy', 'Privacy', 'How the Connecting Quran website and app treat your data: no accounts, no ads, no tracking.');

/** Where readers can write about privacy. TODO before publishing: the user's chosen public contact address. */
const CONTACT = 'privacy@connectingquran.com';
const UPDATED = '24 November 2026';

/** The privacy policy both app stores require; it covers the website and the Android and iOS app. Keep it true to the code. */
export default function Privacy() {
  const sec = (title: string, body: React.ReactNode) => (
    <section className="space-y-2"><h2 className={h4}>{title}</h2><div className="space-y-2 leading-relaxed text-ink">{body}</div></section>
  );
  return (
    <article className={`${card} mx-auto max-w-3xl space-y-6 p-6`}>
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-ink">Privacy</h1>
        <p className="text-sm text-muted">For the Connecting Quran website (www.connectingquran.com) and the Connecting Quran app for Android and iOS. Last updated {UPDATED}.</p>
      </header>

      {sec('In short', <p>There are no accounts, no ads and no tracking. We don&apos;t collect, sell or share personal information.</p>)}

      {sec('What stays on your device', <>
        <p>Your settings (script, translations, text size, colours, reciter), bookmarks and reading history are kept only on your own device:
          in your browser on the website, and on your phone in the app. They are never sent to us.</p>
        <p>On the website, a small cookie (<code>noor_settings</code>) holds your display settings so pages open with your choices. It contains
          nothing that identifies you. Clearing the site&apos;s data in your browser, or uninstalling the app, removes all of it.</p>
      </>)}

      {sec('What the website and app fetch', <>
        <p>Quran text, translations and tafseer come from our server, which reads them from the Quran Foundation (Quran.com), AlQuran Cloud,
          QuranEnc, eQuranLibrary and the other sources credited on the website. Recitation audio plays directly from the reciters&apos; audio
          servers (islamic.network, Quran.com, QuranicAudio, EveryAyah).</p>
        <p>As with any website, these servers see the request itself, including your device&apos;s internet (IP) address. Our website is
          hosted by Vercel, which keeps standard technical logs (address, time, page requested) for a short time for security and
          reliability. We don&apos;t use them to identify anyone.</p>
      </>)}

      {sec('Reminders', <p>If you turn on the daily ayah reminder in the app, it is scheduled on your phone itself. No server is involved.</p>)}

      {sec('Children', <p>The website and app are suitable for all ages and collect no personal information from anyone, children included.</p>)}

      {sec('Changes and contact', <p>If this policy changes, the new version will be posted here with its date. Questions:{' '}
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p>)}
    </article>
  );
}
