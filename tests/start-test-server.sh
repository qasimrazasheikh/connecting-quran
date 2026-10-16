#!/usr/bin/env bash
# Starts the mock API (:4010) and the built app (:3100) pointed at it.
# DATABASE_URL, ADMIN_* and CLIENT_* are set empty so .env.local can't connect the tests to the real catalogue (the app falls back
# to built-in lists) or to the Quran Foundation API (calls to the mock go unsigned).
cd "$(dirname "$0")/.."
# fetched data is cached on disk across builds; clear it so changes to the mock always show up
rm -rf .next/cache/fetch-cache
node tests/mock-api.mjs > /tmp/mock.log 2>&1 &
M=http://localhost:4010
DATABASE_URL= ADMIN_PASSWORD= ADMIN_SECRET= CLIENT_ID= CLIENT_SECRET= QURAN_CLOUD_API=$M/cloud QURAN_COM_API=$M/qc TAFSIR_API=$M/tafsir IP_BACKUP_API=$M/ipb MORPH_URL=$M/morph.txt QURANENC_API=$M/qe QOH_URL=$M/qoh \
  PORT=3100 npx next start > /tmp/next.log 2>&1 &
sleep 4
