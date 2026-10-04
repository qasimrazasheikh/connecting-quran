#!/usr/bin/env bash
# Starts the mock API (:4010) and the built app (:3100) pointed at it.
cd "$(dirname "$0")/.."
node tests/mock-api.mjs > /tmp/mock.log 2>&1 &
M=http://localhost:4010
QURAN_CLOUD_API=$M/cloud QURAN_COM_API=$M/qc TAFSIR_API=$M/tafsir IP_BACKUP_API=$M/ipb MORPH_URL=$M/morph.txt QURANENC_API=$M/qe \
  PORT=3100 npx next start > /tmp/next.log 2>&1 &
sleep 4
