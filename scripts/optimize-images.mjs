// Prepares SDL brand assets and responsive photos from the untouched originals in images/.
// Run with: node scripts/optimize-images.mjs
// Outputs: Public/brand/* (logos, icons, OG image) and Public/images/sdl/* (WebP + JPG per width),
// plus src/data/sdlImages.ts (the manifest <ResponsiveImage> reads).
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'images');
const BRAND_OUT = path.join(ROOT, 'Public', 'brand');
const PHOTO_OUT = path.join(ROOT, 'Public', 'images', 'sdl');
const MANIFEST_OUT = path.join(ROOT, 'src', 'data', 'sdlImages.ts');

const STEP_WIDTHS = [640, 1024, 1600, 2400];
// Every card/tile photo is cropped to this exact square so rows line up at the same height.
// 340 px is the largest square every supplied brand-img file can fill without upscaling.
const CARD_SIZE = 340;

fs.mkdirSync(BRAND_OUT, { recursive: true });
fs.mkdirSync(PHOTO_OUT, { recursive: true });

// ---------------------------------------------------------------------------------------------
// Logo: the supplied logo is a JPEG on white. "Colour to alpha" against white keeps the
// anti-aliased edges smooth instead of leaving a white fringe.
// ---------------------------------------------------------------------------------------------
async function whiteToAlpha(input) {
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 4);
  const LOW = 190; // at or below this "whiteness" a pixel is fully opaque
  const HIGH = 238; // at or above this it is background (JPEG noise keeps the paper at ~240-255)
  for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const whiteness = Math.min(r, g, b);
    let a = whiteness <= LOW ? 1 : 1 - (whiteness - LOW) / (HIGH - LOW);
    a = Math.max(0, Math.min(1, a));
    if (a > 0) {
      // Un-blend from white so edge pixels keep their true colour.
      out[j] = Math.max(0, Math.min(255, Math.round((r - 255 * (1 - a)) / a)));
      out[j + 1] = Math.max(0, Math.min(255, Math.round((g - 255 * (1 - a)) / a)));
      out[j + 2] = Math.max(0, Math.min(255, Math.round((b - 255 * (1 - a)) / a)));
    }
    out[j + 3] = Math.round(a * 255);
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

// How strongly a pixel reads as the logo's red (0 = neutral grey/black/white).
const redness = (r, g, b) => r - Math.max(g, b);
const RED_MIN = 60;

// Reversed logo for dark surfaces: every non-red pixel becomes white; red stays red.
async function toWhiteVersion(pngBuffer) {
  const { data, info } = await sharp(pngBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    if (redness(data[i], data[i + 1], data[i + 2]) < RED_MIN) {
      data[i] = 255; data[i + 1] = 255; data[i + 2] = 255;
    }
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

// Keeps only the red parts of an image (the globe, arrow and parcel of the mark).
async function redOnly(pngBuffer) {
  const { data, info } = await sharp(pngBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const red = redness(data[i], data[i + 1], data[i + 2]);
    if (red < RED_MIN) data[i + 3] = 0;
    else if (red < RED_MIN + 40) data[i + 3] = Math.round(data[i + 3] * (red - RED_MIN) / 40); // soft edge
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

async function buildBrand() {
  const transparent = await whiteToAlpha(path.join(SRC, 'logo.jpeg'));
  const trimmed = await sharp(transparent).trim({ threshold: 1 }).png().toBuffer();
  await sharp(trimmed).png({ palette: true, quality: 90, effort: 10, compressionLevel: 9 }).toFile(path.join(BRAND_OUT, 'sdl-logo.png'));

  const white = await toWhiteVersion(trimmed);
  await sharp(white).png({ palette: true, quality: 90, effort: 10, compressionLevel: 9 }).toFile(path.join(BRAND_OUT, 'sdl-logo-white.png'));

  // Icon mark: the red globe, arrow and parcel that form the "D", without the black letterforms
  // behind them. Crop box measured on the 1170x626 original (includes the arrow tip over the "L").
  const MARK = { left: 538, top: 95, width: 372, height: 250 };
  const markRed = await redOnly(await sharp(transparent).extract(MARK).png().toBuffer());
  const mark = await sharp(markRed).trim({ threshold: 1 }).png().toBuffer();
  const markMeta = await sharp(mark).metadata();
  const side = Math.max(markMeta.width, markMeta.height);
  const squareMark = await sharp(mark)
    .extend({
      top: Math.floor((side - markMeta.height) / 2), bottom: Math.ceil((side - markMeta.height) / 2),
      left: Math.floor((side - markMeta.width) / 2), right: Math.ceil((side - markMeta.width) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png().toBuffer();
  await sharp(squareMark).png({ palette: true, quality: 90, effort: 10, compressionLevel: 9 }).toFile(path.join(BRAND_OUT, 'sdl-mark.png'));

  // favicon: transparent, a little padding. apple-touch-icon: iOS ignores transparency, so white.
  const pad = (size, pct) => Math.round(size * pct);
  const fav = 512, favInner = fav - 2 * pad(fav, 0.04);
  await sharp(squareMark).resize(favInner, favInner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: pad(fav, 0.04), bottom: pad(fav, 0.04), left: pad(fav, 0.04), right: pad(fav, 0.04), background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize(fav, fav).png({ palette: true, quality: 90, effort: 10, compressionLevel: 9 }).toFile(path.join(BRAND_OUT, 'favicon.png'));
  const ati = 180, atiInner = ati - 2 * pad(ati, 0.12);
  await sharp(squareMark).resize(atiInner, atiInner, { fit: 'contain', background: '#ffffff' })
    .flatten({ background: '#ffffff' })
    .extend({ top: pad(ati, 0.12), bottom: pad(ati, 0.12), left: pad(ati, 0.12), right: pad(ati, 0.12), background: '#ffffff' })
    .resize(ati, ati).png({ palette: true, quality: 90, effort: 10, compressionLevel: 9 }).toFile(path.join(BRAND_OUT, 'apple-touch-icon.png'));

  // OG image 1200x630 from the landscape hero.
  await sharp(path.join(SRC, 'landingimage.png')).resize(1200, 630, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(BRAND_OUT, 'og-image.jpg'));
}

// ---------------------------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------------------------
// kind 'card' = fixed CARD_SIZE square (plus 640 when the source allows it).
// kind 'hero' = keeps the given aspect ratio, widths from STEP_WIDTHS up to the source width.
const PHOTOS = [
  { name: 'hero-home', src: 'landingimage.png', kind: 'hero', aspect: 16 / 9 },
  { name: 'hero-home-mobile', src: 'landingimage-mobile.png', kind: 'hero', aspect: 9 / 16 },
  { name: 'track-hero', src: 'landingimage.png', kind: 'hero', aspect: 2 / 1 },
  { name: 'locations-hero', src: 'free-cc0/locations-hero.webp', kind: 'hero', aspect: 2 / 1 },
  { name: 'service-priority-express', src: 'brand-img1.PNG', kind: 'card' },
  { name: 'service-freight-linehaul', src: 'brand-img2.PNG', kind: 'card' },
  { name: 'service-vehicle-transport', src: 'free-cc0/service-vehicle-transport.webp', kind: 'card' },
  { name: 'service-secure-vault', src: 'free-cc0/service-secure-vault.webp', kind: 'card' },
  { name: 'industry-healthcare', src: '../Public/images/home/healthcare-pharma.jpg', kind: 'card' },
  { name: 'industry-technology', src: 'free-cc0/industry-technology.webp', kind: 'card' },
  { name: 'industry-automotive', src: '../Public/images/home/automotive-parts.jpg', kind: 'card' },
  { name: 'industry-ecommerce', src: '../Public/images/home/ecommerce-retail.jpg', kind: 'card' },
  { name: 'track-result-vehicle', src: 'brand-img3.PNG', kind: 'card' },
  { name: 'about-operations', src: 'brand-img4.PNG', kind: 'card' },
  { name: 'contact-team', src: 'brand-img5.PNG', kind: 'card' },
  { name: 'about-team', src: 'brand-img7.PNG', kind: 'card', crop: { left: 0, top: 40, width: 262, height: 262 } },
];

async function writeVariants(pipelineFactory, name, width, height) {
  const base = path.join(PHOTO_OUT, `${name}-${width}`);
  await pipelineFactory().resize(width, height, { fit: 'cover' }).webp({ quality: 78 }).toFile(`${base}.webp`);
  await pipelineFactory().resize(width, height, { fit: 'cover' }).flatten({ background: '#ffffff' })
    .jpeg({ quality: 80, mozjpeg: true, progressive: true }).toFile(`${base}.jpg`);
}

async function buildPhotos() {
  const manifest = {};
  for (const p of PHOTOS) {
    const srcPath = path.join(SRC, p.src);
    const factory = () => (p.crop ? sharp(srcPath).extract(p.crop) : sharp(srcPath));
    const meta = await factory().metadata();
    const srcW = p.crop ? p.crop.width : meta.width;
    const srcH = p.crop ? p.crop.height : meta.height;
    const variants = [];

    if (p.kind === 'card') {
      const maxSquare = Math.min(srcW, srcH);
      // Never upscale: a source smaller than CARD_SIZE is output at its own size. Every card is
      // still a 1:1 square, so CSS renders them all at the same height.
      const base = Math.min(CARD_SIZE, maxSquare);
      const sizes = [base, ...(maxSquare >= 640 ? [640] : [])];
      for (const s of sizes) {
        await writeVariants(factory, p.name, s, s);
        variants.push(s);
      }
      manifest[p.name] = { width: base, height: base, widths: variants };
    } else {
      // Largest crop of the requested aspect that fits the source, then the step widths below it.
      const cropW = Math.min(srcW, Math.floor(srcH * p.aspect));
      const cropH = Math.round(cropW / p.aspect);
      const widths = STEP_WIDTHS.filter(w => w <= cropW);
      if (!widths.includes(cropW) && (widths.length === 0 || cropW - widths[widths.length - 1] > 200)) widths.push(cropW);
      for (const w of widths) {
        await writeVariants(factory, p.name, w, Math.round(w / p.aspect));
        variants.push(w);
      }
      manifest[p.name] = { width: cropW, height: cropH, widths: variants };
    }
  }
  return manifest;
}

function writeManifest(manifest) {
  const body = Object.entries(manifest)
    .map(([k, v]) => `  '${k}': { width: ${v.width}, height: ${v.height}, widths: [${v.widths.join(', ')}] },`)
    .join('\n');
  const ts = `// Generated by scripts/optimize-images.mjs. Do not edit by hand; re-run the script instead.
// Each entry lists the widths available as /images/sdl/<name>-<width>.webp and .jpg.
export interface SdlImageInfo {
  width: number;
  height: number;
  widths: number[];
}

export const SDL_IMAGES = {
${body}
} satisfies Record<string, SdlImageInfo>;

export type SdlImageName = keyof typeof SDL_IMAGES;
`;
  fs.writeFileSync(MANIFEST_OUT, ts);
}

await buildBrand();
const manifest = await buildPhotos();
writeManifest(manifest);
console.log('Done.');
