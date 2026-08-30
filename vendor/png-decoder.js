// Minimal PNG decoder for Cloudflare Workers -- no external dependency.
// Supports: bit depth 8, color types 0 (grayscale), 2 (RGB), 3 (palette),
// 4 (grayscale+alpha), 6 (RGBA), non-interlaced only. Uses the native
// DecompressionStream('deflate') API (available in Workers and Node 18+)
// instead of a bundled zlib implementation.
//
// This intentionally does NOT support every PNG variant (16-bit depth,
// Adam7 interlacing) -- those throw a clear error rather than silently
// producing wrong output.

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function parseChunks(bytes) {
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== PNG_SIGNATURE[i]) throw new Error('Not a valid PNG (bad signature).');
  }
  const chunks = [];
  let pos = 8;
  while (pos < bytes.length) {
    const length = (bytes[pos] << 24) | (bytes[pos + 1] << 16) | (bytes[pos + 2] << 8) | bytes[pos + 3];
    const type = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]);
    const data = bytes.slice(pos + 8, pos + 8 + length);
    chunks.push({ type, data });
    pos += 8 + length + 4;
    if (type === 'IEND') break;
  }
  return chunks;
}

async function inflate(bytes) {
  const ds = new DecompressionStream('deflate');
  const writer = ds.writable.getWriter();
  writer.write(bytes);
  writer.close();
  const chunks = [];
  const reader = ds.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) { out.set(c, offset); offset += c.length; }
  return out;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function unfilter(raw, width, height, bpp) {
  const bytesPerScanline = width * bpp;
  const stride = bytesPerScanline + 1;
  const out = new Uint8Array(height * bytesPerScanline);

  for (let y = 0; y < height; y++) {
    const filterType = raw[y * stride];
    const rowStart = y * stride + 1;
    const outRowStart = y * bytesPerScanline;
    const prevOutRowStart = outRowStart - bytesPerScanline;

    for (let x = 0; x < bytesPerScanline; x++) {
      const rawByte = raw[rowStart + x];
      const a = x >= bpp ? out[outRowStart + x - bpp] : 0;
      const b = y > 0 ? out[prevOutRowStart + x] : 0;
      const c = (y > 0 && x >= bpp) ? out[prevOutRowStart + x - bpp] : 0;

      let value;
      switch (filterType) {
        case 0: value = rawByte; break;
        case 1: value = (rawByte + a) & 0xff; break;
        case 2: value = (rawByte + b) & 0xff; break;
        case 3: value = (rawByte + Math.floor((a + b) / 2)) & 0xff; break;
        case 4: value = (rawByte + paeth(a, b, c)) & 0xff; break;
        default: throw new Error(`Unsupported PNG filter type: ${filterType}`);
      }
      out[outRowStart + x] = value;
    }
  }
  return out;
}

function toRgba(unfiltered, width, height, colorType, palette, transparency) {
  const rgba = new Uint8Array(width * height * 4);
  let channels;
  switch (colorType) {
    case 0: channels = 1; break;
    case 2: channels = 3; break;
    case 3: channels = 1; break;
    case 4: channels = 2; break;
    case 6: channels = 4; break;
    default: throw new Error(`Unsupported PNG color type: ${colorType}`);
  }

  for (let i = 0; i < width * height; i++) {
    const si = i * channels;
    const di = i * 4;
    if (colorType === 0) {
      const g = unfiltered[si];
      rgba[di] = g; rgba[di + 1] = g; rgba[di + 2] = g; rgba[di + 3] = 255;
    } else if (colorType === 2) {
      rgba[di] = unfiltered[si]; rgba[di + 1] = unfiltered[si + 1]; rgba[di + 2] = unfiltered[si + 2]; rgba[di + 3] = 255;
    } else if (colorType === 3) {
      const idx = unfiltered[si];
      const p = idx * 3;
      rgba[di] = palette[p]; rgba[di + 1] = palette[p + 1]; rgba[di + 2] = palette[p + 2];
      rgba[di + 3] = transparency && idx < transparency.length ? transparency[idx] : 255;
    } else if (colorType === 4) {
      const g = unfiltered[si];
      rgba[di] = g; rgba[di + 1] = g; rgba[di + 2] = g; rgba[di + 3] = unfiltered[si + 1];
    } else if (colorType === 6) {
      rgba[di] = unfiltered[si]; rgba[di + 1] = unfiltered[si + 1]; rgba[di + 2] = unfiltered[si + 2]; rgba[di + 3] = unfiltered[si + 3];
    }
  }
  return rgba;
}

export async function decodePng(bytes) {
  const chunks = parseChunks(bytes);
  const ihdr = chunks.find((c) => c.type === 'IHDR');
  if (!ihdr) throw new Error('Missing IHDR chunk.');

  const d = ihdr.data;
  const width = (d[0] << 24) | (d[1] << 16) | (d[2] << 8) | d[3];
  const height = (d[4] << 24) | (d[5] << 16) | (d[6] << 8) | d[7];
  const bitDepth = d[8];
  const colorType = d[9];
  const interlace = d[12];

  if (bitDepth !== 8) throw new Error(`Only 8-bit PNGs are supported (got ${bitDepth}-bit).`);
  if (interlace !== 0) throw new Error('Interlaced (Adam7) PNGs are not supported.');

  let palette = null;
  const plteChunk = chunks.find((c) => c.type === 'PLTE');
  if (plteChunk) palette = plteChunk.data;

  let transparency = null;
  const trnsChunk = chunks.find((c) => c.type === 'tRNS');
  if (trnsChunk) transparency = trnsChunk.data;

  const idatChunks = chunks.filter((c) => c.type === 'IDAT');
  const totalIdatLength = idatChunks.reduce((n, c) => n + c.data.length, 0);
  const idat = new Uint8Array(totalIdatLength);
  let offset = 0;
  for (const c of idatChunks) { idat.set(c.data, offset); offset += c.data.length; }

  const inflated = await inflate(idat);

  const channelsMap = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
  const bpp = channelsMap[colorType];
  if (!bpp) throw new Error(`Unsupported PNG color type: ${colorType}`);

  const unfiltered = unfilter(inflated, width, height, bpp);
  const rgba = toRgba(unfiltered, width, height, colorType, palette, transparency);

  return { width, height, data: rgba };
}
