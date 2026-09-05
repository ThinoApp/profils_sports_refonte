/**
 * Build real extrusion contours from the supplied, unmodified brand artwork.
 * Tooling only: node scripts/build-logo-geometry.mjs INPUT_PNG PLAYWRIGHT_MODULE
 * PLAYWRIGHT_MODULE is an absolute path to an installed playwright/index.mjs.
 * No tracing, raster decoding or tooling dependency ships to visitors.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const [input, playwrightModule] = process.argv.slice(2);
if (!input || !playwrightModule) throw new Error('Supply the original PNG and Playwright module paths.');
const { chromium } = await import(pathToFileURL(playwrightModule));
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
try {
  const page = await browser.newPage();
  const source = `data:image/png;base64,${(await readFile(input)).toString('base64')}`;
  const result = await page.evaluate(async (src) => {
    const image = new Image();
    image.src = src;
    await image.decode();
    const size = 1200;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, size, size);
    const { data } = context.getImageData(0, 0, size, size);
    const masks = [new Uint8Array(size * size), new Uint8Array(size * size)];
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const index = y * size + x, i = index * 4;
      if (data[i + 3] < 128) continue;
      if (data[i] > 170 && data[i + 1] > 150 && data[i + 2] < 170) masks[0][index] = 1;
      // The authentic perimeter becomes a smooth machined ring, not a pixel contour.
      else if (data[i] < 170 && data[i + 1] < 170 && data[i + 2] < 170 && Math.hypot(x / size - .5, y / size - .5) < .485) masks[1][index] = 1;
    }
    function simplify(points, epsilon = .85) {
      if (points.length < 4) return points;
      const [ax, ay] = points[0], [bx, by] = points[points.length - 1];
      const dx = bx - ax, dy = by - ay, length = dx * dx + dy * dy;
      let max = epsilon * epsilon, pivot = 0;
      for (let i = 1; i < points.length - 1; i++) {
        const [x, y] = points[i];
        const t = length ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / length)) : 0;
        const distance = (x - ax - t * dx) ** 2 + (y - ay - t * dy) ** 2;
        if (distance > max) { max = distance; pivot = i; }
      }
      return pivot ? [...simplify(points.slice(0, pivot + 1), epsilon).slice(0, -1), ...simplify(points.slice(pivot), epsilon)] : [points[0], points[points.length - 1]];
    }
    const area = points => points.reduce((sum, p, i) => { const q = points[(i + 1) % points.length]; return sum + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
    function inside(point, polygon) {
      let hit = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const a = polygon[i], b = polygon[j];
        if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) hit = !hit;
      }
      return hit;
    }
    function trace(mask) {
      const edges = [], starts = new Map(), stride = size + 1;
      function add(x, y, nx, ny, direction) {
        const from = y * stride + x, to = ny * stride + nx, index = edges.length;
        edges.push({ from, to, direction, used: false });
        if (!starts.has(from)) starts.set(from, []);
        starts.get(from).push(index);
      }
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        if (!mask[y * size + x]) continue;
        if (!y || !mask[(y - 1) * size + x]) add(x, y, x + 1, y, 0);
        if (x === size - 1 || !mask[y * size + x + 1]) add(x + 1, y, x + 1, y + 1, 1);
        if (y === size - 1 || !mask[(y + 1) * size + x]) add(x + 1, y + 1, x, y + 1, 2);
        if (!x || !mask[y * size + x - 1]) add(x, y + 1, x, y, 3);
      }
      const loops = [];
      for (const first of edges) {
        if (first.used) continue;
        let edge = first;
        const points = [];
        while (edge && !edge.used) {
          edge.used = true;
          points.push([edge.from % stride, Math.floor(edge.from / stride)]);
          if (edge.to === first.from) break;
          const candidates = (starts.get(edge.to) || []).map(i => edges[i]).filter(e => !e.used);
          // Right-hand boundary walk keeps diagonal-touching regions separate.
          const priority = [1, 0, 3, 2];
          candidates.sort((a, b) => priority.indexOf((a.direction - edge.direction + 4) % 4) - priority.indexOf((b.direction - edge.direction + 4) % 4));
          edge = candidates[0];
        }
        const signed = area(points);
        if (Math.abs(signed) < 2) continue;
        const middle = Math.floor(points.length / 2);
        const reduced = [...simplify(points.slice(0, middle + 1)).slice(0, -1), ...simplify([...points.slice(middle), points[0]]).slice(0, -1)];
        loops.push({ points: reduced.length >= 3 ? reduced : points, area: signed });
      }
      const shapes = loops.filter(loop => loop.area > 0).map(loop => ({ outer: loop.points, holes: [], area: loop.area }));
      for (const hole of loops.filter(loop => loop.area < 0)) {
        const parent = shapes.filter(shape => shape.area > -hole.area && inside(hole.points[0], shape.outer)).sort((a, b) => a.area - b.area)[0];
        if (parent) parent.holes.push(hole.points);
      }
      return shapes.map(({ outer, holes }) => ({ outer, holes }));
    }
    return { version: 1, size, source: 'image jaune.png — original Profils Sports artwork', yellow: trace(masks[0]), silver: trace(masks[1]) };
  }, source);
  const destination = new URL('../assets/brand/profils-sports-emblem-contours.json', import.meta.url);
  await writeFile(destination, JSON.stringify(result));
  console.log(JSON.stringify({ yellowShapes: result.yellow.length, silverShapes: result.silver.length, holes: [...result.yellow, ...result.silver].reduce((sum, s) => sum + s.holes.length, 0), bytes: JSON.stringify(result).length }));
} finally {
  await browser.close();
}
