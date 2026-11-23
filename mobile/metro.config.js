// The Quran data ships as .dat asset files (one per surah), read on demand, so it stays out of the JS bundle.
const {getDefaultConfig} = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('dat');

module.exports = config;
