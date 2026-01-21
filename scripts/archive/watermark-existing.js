#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
async function apply() {
  const cwd = process.cwd();
  const srcDir = path.join(cwd, 'public', 'uploads', 'vehicles');
  const outDirBase = path.join(cwd, 'public', 'uploads');

  const argv = process.argv.slice(2);
  const inplace = argv.includes('--inplace');
  const outDir = inplace ? srcDir : path.join(outDirBase, 'vehicles-watermarked');

  try {
    await fs.access(srcDir);
  } catch (err) {
    console.error('[watermark-existing] source directory not found:', srcDir);
    process.exit(1);
  }

  try {
    await fs.mkdir(outDir, { recursive: true });
  } catch (err) {
    console.error('[watermark-existing] failed to create outdir', outDir, err);
    process.exit(1);
  }

  const files = (await fs.readdir(srcDir)).filter(f => {
    const e = path.extname(f).toLowerCase();
    return e === '.jpg' || e === '.jpeg' || e === '.png' || e === '.webp';
  });

  if (!files.length) {
    console.log('[watermark-existing] no image files found in', srcDir);
    return;
  }

  console.log(`[watermark-existing] processing ${files.length} files -> ${inplace ? 'in-place' : outDir}`);

  const sharp = await import('sharp').then(m => m.default ?? m).catch((e) => {
    console.error('[watermark-existing] sharp is required. Install it with: npm install sharp');
    process.exit(1);
  });

  for (const fname of files) {
    const srcPath = path.join(srcDir, fname);
    const destPath = path.join(outDir, fname);
    try {
      const buf = await fs.readFile(srcPath);
      const img = sharp(buf);
      const meta = await img.metadata();
      const w = meta.width || 800;
      const h = meta.height || 600;

      // Match watermark settings used in lib/file-upload.ts
      const text = process.env.WATERMARK_TEXT || 'karkey';
      const fontSize = Math.max(11, Math.round(Math.min(w, h) / 11));
      const svg = `<?xml version="1.0" encoding="utf-8"?>\n` +
        `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>` +
        `<style>` +
        `.t { fill: rgba(255,255,255,0.2); font-family: sans-serif; font-size: ${fontSize}px; font-weight: bold; }` +
        `</style>` +
        `<text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle' class='t' transform="rotate(-30 ${w / 2} ${h / 2})">${text}</text>` +
        `</svg>`;

      const outBuf = await img
        .composite([{ input: Buffer.from(svg), gravity: 'centre' }])
        .toBuffer();

      await fs.writeFile(destPath, outBuf);
      console.log('[watermark-existing] wrote', destPath);
    } catch (err) {
      console.warn('[watermark-existing] failed for', fname, err?.message ?? err);
    }
  }

  console.log('[watermark-existing] done');
}

apply().catch(err => { console.error('[watermark-existing] fatal', err); process.exit(1) });
