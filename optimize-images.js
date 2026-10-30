import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const dirsToOptimize = [
  path.join(process.cwd(), 'public', 'img'),
  path.join(process.cwd(), 'public', 'assets', 'images')
];

async function optimizeDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      await optimizeDirectory(filePath);
      continue;
    }

    const ext = path.extname(file).toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
      const parsed = path.parse(filePath);
      const webpPath = path.join(parsed.dir, `${parsed.name}.webp`);

      try {
        const metadata = await sharp(filePath).metadata();
        const isBanner = file.includes('banner') || file.includes('hero');
        const maxDimension = isBanner ? 1200 : 800;

        let pipeline = sharp(filePath);

        if (metadata.width && metadata.width > maxDimension) {
          pipeline = pipeline.resize({ width: maxDimension, withoutEnlargement: true });
        }

        const buffer = await pipeline
          .webp({ quality: 80, effort: 6 })
          .toBuffer();

        // Save WebP version
        fs.writeFileSync(webpPath, buffer);
        console.log(`Optimized ${file} -> ${path.basename(webpPath)} (${(buffer.length / 1024).toFixed(1)} KB)`);

        // If original was PNG or JPG, also re-compress PNG/JPG to be smaller
        if (ext === '.png') {
          const pngBuffer = await sharp(filePath)
            .resize({ width: maxDimension, withoutEnlargement: true })
            .png({ compressionLevel: 9, palette: true })
            .toBuffer();
          fs.writeFileSync(filePath, pngBuffer);
        } else if (ext === '.jpg' || ext === '.jpeg') {
          const jpgBuffer = await sharp(filePath)
            .resize({ width: maxDimension, withoutEnlargement: true })
            .jpeg({ quality: 80, mozjpeg: true })
            .toBuffer();
          fs.writeFileSync(filePath, jpgBuffer);
        }
      } catch (err) {
        console.error(`Failed to optimize ${file}:`, err.message);
      }
    }
  }
}

async function run() {
  console.log('Starting SULTA Image Optimization Engine...');
  for (const dir of dirsToOptimize) {
    await optimizeDirectory(dir);
  }
  console.log('All image assets optimized successfully!');
}

run();
