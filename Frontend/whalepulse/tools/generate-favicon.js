const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIco = async (...args) => (await import('png-to-ico')).default(...args);

async function build() {
  const inSvg = path.resolve(__dirname, '../public/logo-icon.svg');
  const tmpPngs = [16, 32, 48, 64, 128].map((s) => path.resolve(__dirname, `../public/.favicon-${s}.png`));

  const svg = fs.readFileSync(inSvg);

  // produce PNGs
  await Promise.all(tmpPngs.map((out, i) => {
    const size = [16,32,48,64,128][i];
    return sharp(svg).resize(size, size).png().toFile(out);
  }));

  // generate ico
  const pngBuffers = tmpPngs.map((p) => fs.readFileSync(p));
  const ico = await pngToIco(pngBuffers);
  fs.writeFileSync(path.resolve(__dirname, '../public/favicon.ico'), ico);

  // cleanup
  tmpPngs.forEach((p) => fs.unlinkSync(p));
  console.log('favicon.ico generated in public/');
}

build().catch((e) => { console.error(e); process.exit(1); });
