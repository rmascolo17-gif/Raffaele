import { writeFileSync, mkdirSync } from 'fs';
import { deflateSync } from 'zlib';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '..', 'public', 'icons');

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([t, data]);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc32(crcData));
  return Buffer.concat([len, t, data, c]);
}

function createPNG(width, height) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // slate-900 bg (#0f172a), center "NC" area with slate-700 (#334155) box
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const row = y * (1 + width * 3);
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const off = row + 1 + x * 3;
      // Draw a simple "NC" indicator: lighter rounded rect in center
      const margin = Math.floor(width * 0.2);
      const cx = width / 2;
      const cy = height / 2;
      const hw = width * 0.3;
      const hh = height * 0.3;
      if (Math.abs(x - cx) < hw && Math.abs(y - cy) < hh) {
        // Center box: blue-600 (#2563eb)
        raw[off] = 0x25;
        raw[off + 1] = 0x63;
        raw[off + 2] = 0xeb;
      } else {
        // Background: slate-900 (#0f172a)
        raw[off] = 0x0f;
        raw[off + 1] = 0x17;
        raw[off + 2] = 0x2a;
      }
    }
  }

  const compressed = deflateSync(raw);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT, { recursive: true });

for (const size of [192, 512]) {
  const png = createPNG(size, size);
  writeFileSync(resolve(OUT, `icon-${size}x${size}.png`), png);
  console.log(`Created icon-${size}x${size}.png (${(png.length / 1024).toFixed(1)} KB)`);
}
