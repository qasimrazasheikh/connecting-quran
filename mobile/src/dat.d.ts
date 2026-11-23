/** .dat files are Metro assets (see metro.config.js): require() gives an asset id. */
declare module '*.dat' {
  const asset: number;
  export default asset;
}
