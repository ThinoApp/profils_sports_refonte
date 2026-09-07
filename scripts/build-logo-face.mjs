/** Create the high-definition front detail used on top of the extruded logo. */
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const [input, playwrightModule, output] = process.argv.slice(2);
if (!input || !playwrightModule || !output) throw new Error('Supply input PNG, Playwright module and output WebP paths.');
const { chromium } = await import(pathToFileURL(playwrightModule));
const browser = await chromium.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true });
try {
  const page = await browser.newPage();
  const source = `data:image/png;base64,${(await readFile(input)).toString('base64')}`;
  const encoded = await page.evaluate(async src => {
    const image = new Image(); image.src = src; await image.decode();
    const size = 3072;
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
    const context = canvas.getContext('2d', { willReadFrequently:true });
    context.drawImage(image, 0, 0, size, size);
    const pixels = context.getImageData(0, 0, size, size);
    const data = pixels.data;
    const smoothstep = (a, b, value) => { const t = Math.max(0, Math.min(1, (value - a) / (b - a))); return t * t * (3 - 2 * t); };
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], sourceAlpha = data[i + 3];
      if (sourceAlpha < 8) { data[i + 3] = 0; continue; }
      const spread = Math.max(r, g, b) - Math.min(r, g, b);
      const dark = 255 - Math.max(r, g, b);
      const alpha = Math.max(smoothstep(3, 26, spread), smoothstep(5, 74, dark));
      data[i + 3] = Math.round(sourceAlpha * alpha);
      // The original charcoal is deliberately converted to architectural paper
      // so the details stay legible on the site's ink surface.
      if (spread < 26 && dark > 5) { data[i] = 241; data[i + 1] = 239; data[i + 2] = 230; }
    }
    context.putImageData(pixels, 0, 0);
    return canvas.toDataURL('image/webp', .985);
  }, source);
  await writeFile(output, Buffer.from(encoded.split(',')[1], 'base64'));
  console.log(output);
} finally { await browser.close(); }
