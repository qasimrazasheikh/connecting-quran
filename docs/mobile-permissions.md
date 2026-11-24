# Mobile app — content permissions

Drafts for asking each source whether its content may be shown inside the Connecting Quran app, plus the other sources to check.
Fill in `[Your name]` and `[contact address]`, send from the site's contact address, and record replies at the bottom.
The app should not go public until the first three are answered (or the content they cover is removed from the app).

---

## 1. Quran Foundation (Quran.com API)

**To:** Quran Foundation developer support (via https://quran.foundation, API / developer contact)
**Subject:** Using Quran.com API content in the Connecting Quran mobile app

> Assalamu alaikum,
>
> I run Connecting Quran (https://www.connectingquran.com), a free Quran reading site with no ads, which uses the Quran Foundation
> API under our registered client and credits Quran Foundation on every page.
>
> We are building a free Android and iOS app for the same readers. To let it work offline, we would like to:
>
> 1. ship inside the app the Arabic text (QPC Uthmani Hafs and Indo-Pak Nastaleeq) and the word-by-word translations and
>    transliterations, fetched once from the API;
> 2. serve other translations to the app through our own server, which calls your API with our credentials (the app never
>    holds them), with caching;
> 3. play the word-by-word audio from audio.qurancdn.com.
>
> The app would credit Quran Foundation / Quran.com in its About screen and store listing, exactly as the website does.
> Is this within the API's terms for client apps, and is there anything else you would like us to do (attribution text,
> a link, rate limits, or registering the app)?
>
> JazakAllahu khairan,
> [Your name], Connecting Quran — [contact address]

---

## 2. eQuranLibrary

**To:** eQuranLibrary (contact page on https://equranlibrary.com)
**Subject:** Showing eQuranLibrary tafseers in the Connecting Quran app

> Assalamu alaikum,
>
> Connecting Quran (https://www.connectingquran.com) is a free, ad-free Quran reading site. It lists a number of the tafseers on
> eQuranLibrary (Tafheem-ul-Quran, Ma'arif-ul-Quran, Tadabbur-e-Quran, Bayan-ul-Quran and others) and shows the note for each ayah,
> credited to eQuranLibrary with a link to your page.
>
> We are now building a free Android and iOS app and would like to show the same tafseer notes in it, in the same way: one ayah at
> a time, read from your ayah page by our server when a reader opens it, with your name and a link back on every note. Nothing
> would be copied in bulk or bundled in the app.
>
> May we do this? If you have conditions (wording of the credit, which works may or may not be shown, caching), we will follow them.
>
> JazakAllahu khairan,
> [Your name], Connecting Quran — [contact address]

---

## 3. QuranoHadith

**To:** QuranoHadith (contact page on https://quranohadith.com)
**Subject:** Showing QuranoHadith tafseers in the Connecting Quran app

> Assalamu alaikum,
>
> Connecting Quran (https://www.connectingquran.com) is a free, ad-free Quran reading site. We would like to show the Urdu tafseers
> on your ayah pages (https://quranohadith.com/alquran-tafseer/{surah}/{ayah}) on our website and in our free Android and iOS app,
> one ayah at a time when a reader opens it, credited to QuranoHadith with a link back to your page. Nothing would be copied in bulk.
>
> May we do this, and are there conditions you would like us to follow?
>
> JazakAllahu khairan,
> [Your name], Connecting Quran — [contact address]

*(QuranoHadith is "pending" in the catalogue today, so neither the site nor the app shows it until it is approved in /admin.)*

---

## Other sources to check before launch

| Source | What the app uses | To check |
|---|---|---|
| AlQuran Cloud | Translations not carried by Quran Foundation (e.g. Muhammad Asad, Ahmed Ali) | API terms; each translation's own copyright |
| Saheeh International | English translation, bundled in the app | Copyright holder's terms for apps |
| QuranEnc (Rowwad) | Ahsan-ul-Bayan notes (Junagarhi) via the tafseer route | Terms of use for apps |
| tafsir_api (open source) | Most tafseer texts | Licence of the repository and of each tafseer it carries |
| Reciter audio: islamic.network, Quran.com, QuranicAudio, EveryAyah | Streaming, and downloads for offline listening | Terms for apps and for offline downloads |
| Fonts: KFGQPC Uthmanic Hafs, Indo-Pak Nastaleeq (QuranWBW), surah names (Quran.com), Mehr Nastaliq (CC BY-SA 4.0) | Shipped inside the app | Embedding allowed; Mehr Nastaliq needs credit in the app's About screen |
| Quranic Arabic Corpus (GNU GPL) | Word grammar, bundled | GPL terms for the data; credit in the app |

## Replies

| Source | Sent on | Reply | Conditions |
|---|---|---|---|
| Quran Foundation | | | |
| eQuranLibrary | | | |
| QuranoHadith | | | |
