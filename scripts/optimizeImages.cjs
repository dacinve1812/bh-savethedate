/**
 * Image Optimization Script
 * 
 * Tạo thumbnails và optimize full-size images cho gallery
 * 
 * Usage:
 * 1. Install dependencies: npm install sharp
 * 2. Place original images in: public/images/original/
 * 3. Run: npm run optimize-images
 * 
 * Output:
 * - Thumbnails: public/images/thumbnails/ (600px width, ~50-200KB)
 * - Full-size optimized: public/images/full/ (compressed, ~1-5MB)
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  // Input: ưu tiên public/images/original, nếu không có thì dùng public/
  inputDir: path.join(__dirname, '../public/images/original'),
  fallbackInputDir: path.join(__dirname, '../public'),
  thumbnailsDir: path.join(__dirname, '../public/images/thumbnails'),
  fullDir: path.join(__dirname, '../public/images/full'),
  // 4 size: 240/400/600/800 — tại 432px 50vw≈216px, DPR3 cần 648px nên cần 800w
  thumbnailWidths: [240, 400, 600, 800],
  thumbnailFormat: 'webp',
  thumbnailQuality: 80,
  fullQuality: 85,
  supportedFormats: ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']
};

async function ensureDirectory(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
    console.log(`✓ Directory created/verified: ${dir}`);
  } catch (error) {
    console.error(`✗ Error creating directory ${dir}:`, error);
    throw error;
  }
}

async function optimizeImage(inputPath, outputPath, options) {
  try {
    const { width, quality, format = 'jpeg', sharpen } = options;
    
    let pipeline = sharp(inputPath);
    
    if (width) {
      pipeline = pipeline.resize(width, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    }
    if (sharpen) {
      pipeline = pipeline.sharpen(); // Nhẹ, giúp thumb nét hơn ở cùng dung lượng
    }
    
    if (format === 'jpeg') {
      pipeline = pipeline.jpeg({ 
        quality, 
        mozjpeg: true // Better compression
      });
    } else if (format === 'webp') {
      pipeline = pipeline.webp({ 
        quality 
      });
    } else {
      pipeline = pipeline.png({ 
        quality: Math.min(quality, 9),
        compressionLevel: 9
      });
    }
    
    await pipeline.toFile(outputPath);
    return true;
  } catch (error) {
    console.error(`✗ Error processing ${path.basename(inputPath)}:`, error.message);
    return false;
  }
}

async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return (stats.size / 1024 / 1024).toFixed(2); // Size in MB
  } catch {
    return '0';
  }
}

async function getFileModifiedTime(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.mtimeMs; // Modified time in milliseconds
  } catch {
    return 0;
  }
}

/**
 * Kiểm tra xem ảnh đã được optimize chưa
 * Returns true nếu tất cả thumbnail variants + full-size tồn tại và mới hơn (hoặc bằng) input
 */
async function isImageAlreadyOptimized(inputPath, thumbnailPaths, fullPath) {
  try {
    const inputTime = await getFileModifiedTime(inputPath);
    const fullTime = await getFileModifiedTime(fullPath);
    if (fullTime < inputTime) return false;
    for (const thumbPath of thumbnailPaths) {
      const t = await getFileModifiedTime(thumbPath);
      if (t < inputTime) return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function findImagesInDirectory(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isFile()) {
        // Check if it's an image file
        if (CONFIG.supportedFormats.some(format => entry.name.endsWith(format))) {
          files.push(fullPath);
        }
      } else if (entry.isDirectory() && !entry.name.startsWith('images')) {
        // Recursively search in subdirectories (but skip 'images' folder to avoid processing outputs)
        const subFiles = await findImagesInDirectory(fullPath);
        files.push(...subFiles);
      }
    }
    
    return files;
  } catch (error) {
    return [];
  }
}

async function processImages() {
  console.log('\n🖼️  Image Optimization Script\n');
  console.log('='.repeat(50));
  
  // Ensure output directories exist (script tự tạo)
  await ensureDirectory(CONFIG.thumbnailsDir);
  await ensureDirectory(CONFIG.fullDir);
  
  // Tìm ảnh trong thư mục input (ưu tiên original, fallback về public/)
  let imageFiles = [];
  let inputDirUsed = CONFIG.inputDir;
  
  try {
    // Thử đọc từ public/images/original trước
    const entries = await fs.readdir(CONFIG.inputDir, { withFileTypes: true });
    imageFiles = entries
      .filter(entry => entry.isFile() && CONFIG.supportedFormats.some(format => entry.name.endsWith(format)))
      .map(entry => path.join(CONFIG.inputDir, entry.name));
    
    if (imageFiles.length === 0) {
      // Nếu không có trong original, thử scan public/ (nhưng skip các thư mục images)
      console.log(`\n⚠ No images found in: ${CONFIG.inputDir}`);
      console.log(`   Searching in: ${CONFIG.fallbackInputDir}\n`);
      
      inputDirUsed = CONFIG.fallbackInputDir;
      imageFiles = await findImagesInDirectory(CONFIG.fallbackInputDir);
    }
  } catch (error) {
    // Nếu thư mục original không tồn tại, scan public/ trực tiếp
    console.log(`\n⚠ Directory not found: ${CONFIG.inputDir}`);
    console.log(`   Searching in: ${CONFIG.fallbackInputDir}\n`);
    
    inputDirUsed = CONFIG.fallbackInputDir;
    imageFiles = await findImagesInDirectory(CONFIG.fallbackInputDir);
  }
  
  if (imageFiles.length === 0) {
    console.log(`\n⚠ No images found in: ${inputDirUsed}`);
    console.log('\n📝 Instructions:');
    console.log('  1. Place your images in: public/images/original/ (recommended)');
    console.log('     OR place images directly in: public/');
    console.log('  2. Supported formats: .jpg, .jpeg, .png');
    console.log('  3. Run: npm run optimize-images\n');
    process.exit(0);
  }
  
  // Convert to relative paths for display
  const files = imageFiles.map(fullPath => {
    const relativePath = path.relative(inputDirUsed, fullPath);
    return { fullPath, relativePath: relativePath || path.basename(fullPath) };
  });
  
  console.log(`\n📸 Found ${files.length} image(s) to process`);
  console.log(`   Source: ${inputDirUsed}\n`);
  
  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;
  const stats = {
    totalOriginalSize: 0,
    totalThumbnailSize: 0,
    totalFullSize: 0
  };
  
  // Process each image
  for (const { fullPath: inputImagePath, relativePath } of files) {
    const baseName = path.parse(relativePath).name;
    const ext = path.parse(relativePath).ext.toLowerCase();
    
    // Output: 3 thumbnail sizes (240/400/600) + full
    const safeBaseName = relativePath.replace(/[^a-zA-Z0-9]/g, '_').replace(/\.[^/.]+$/, '');
    const thumbExt = CONFIG.thumbnailFormat === 'webp' ? '.webp' : '.jpg';
    const thumbnailPaths = CONFIG.thumbnailWidths.map(w =>
      path.join(CONFIG.thumbnailsDir, `${safeBaseName}-${w}${thumbExt}`)
    );
    const fullName = `${safeBaseName}${ext === '.png' ? '.png' : '.jpg'}`;
    const optimizedFullPath = path.join(CONFIG.fullDir, fullName);
    
    try {
      const originalSize = parseFloat(await getFileSize(inputImagePath));
      stats.totalOriginalSize += originalSize;
      
      const alreadyOptimized = await isImageAlreadyOptimized(inputImagePath, thumbnailPaths, optimizedFullPath);
      
      if (alreadyOptimized) {
        for (const p of thumbnailPaths) {
          stats.totalThumbnailSize += parseFloat(await getFileSize(p));
        }
        stats.totalFullSize += parseFloat(await getFileSize(optimizedFullPath));
        skippedCount++;
        console.log(`⏭️  Skipped (already optimized): ${relativePath} (${originalSize} MB)`);
        console.log(`   ✓ Thumbnails: ${CONFIG.thumbnailWidths.join('w/')}${thumbExt}`);
        console.log(`   ✓ Full-size: ${fullName}\n`);
        continue;
      }
      
      console.log(`Processing: ${relativePath} (${originalSize} MB)`);
      
      let allThumbOk = true;
      for (let i = 0; i < CONFIG.thumbnailWidths.length; i++) {
        const w = CONFIG.thumbnailWidths[i];
        const outPath = thumbnailPaths[i];
        const ok = await optimizeImage(inputImagePath, outPath, {
          width: w,
          quality: CONFIG.thumbnailQuality,
          format: CONFIG.thumbnailFormat,
          sharpen: true
        });
        if (ok) {
          const sz = parseFloat(await getFileSize(outPath));
          stats.totalThumbnailSize += sz;
          console.log(`  ✓ Thumb ${w}w: ${path.basename(outPath)} (${(sz * 1024).toFixed(0)} KB)`);
        } else allThumbOk = false;
      }
      const thumbSuccess = allThumbOk;
      
      // Optimize full-size
      const fullSuccess = await optimizeImage(inputImagePath, optimizedFullPath, {
        quality: CONFIG.fullQuality,
        format: ext === '.png' ? 'png' : 'jpeg'
      });
      
      if (fullSuccess) {
        const optimizedSize = parseFloat(await getFileSize(optimizedFullPath));
        stats.totalFullSize += optimizedSize;
        console.log(`  ✓ Full-size: ${fullName} (${optimizedSize} MB)`);
        
        if (thumbSuccess && fullSuccess) {
          successCount++;
          const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
          console.log(`  📊 Full size reduction: ${reduction}%\n`);
        }
      }
      
      if (!thumbSuccess || !fullSuccess) {
        failCount++;
        console.log(`  ✗ Failed to process\n`);
      }
      
    } catch (error) {
      console.error(`  ✗ Error: ${error.message}\n`);
      failCount++;
    }
  }
  
  // Summary
  console.log('='.repeat(50));
  console.log('\n📊 Summary:\n');
  console.log(`  ✓ Successfully processed: ${successCount} image(s)`);
  if (skippedCount > 0) {
    console.log(`  ⏭️  Skipped (already optimized): ${skippedCount} image(s)`);
  }
  if (failCount > 0) {
    console.log(`  ✗ Failed: ${failCount} image(s)`);
  }
  console.log(`\n  Original total size: ${stats.totalOriginalSize.toFixed(2)} MB`);
  console.log(`  Thumbnails total size: ${stats.totalThumbnailSize.toFixed(2)} MB`);
  console.log(`  Full-size total size: ${stats.totalFullSize.toFixed(2)} MB`);
  if (stats.totalOriginalSize > 0) {
    console.log(`  Total reduction: ${((stats.totalOriginalSize - stats.totalFullSize) / stats.totalOriginalSize * 100).toFixed(1)}%`);
  }
  
  console.log('\n💡 Tip: Script automatically skips already-optimized images');
  console.log('   (checks if output files are newer than or equal to input file)');

  // Tự động sinh danh sách gallery từ ảnh đã có trong original/ (hoặc public/)
  await writeGalleryList(files);

  console.log('\n');
}

/**
 * Ghi file src/galleryImages.generated.js – Gallery.jsx import từ đây, không cần gõ tay.
 * Mọi ảnh trong public/images/original/ (hoặc public/) sẽ tự động có trong gallery.
 */
async function writeGalleryList(files) {
  const outPath = path.join(__dirname, '../src/galleryImages.generated.js');
  const sorted = [...files].sort((a, b) => path.basename(a.relativePath).localeCompare(path.basename(b.relativePath)));
  const entries = sorted.map(({ relativePath }) => {
    const base = path.basename(relativePath);
    const name = path.parse(relativePath).name;
    return { src: `/${base}`, alt: name };
  });
  const content = `/**
 * Auto-generated by scripts/optimizeImages.cjs – do not edit by hand.
 * Thêm ảnh vào public/images/original/ rồi chạy: npm run optimize-images
 */
export const GALLERY_IMAGES = ${JSON.stringify(entries, null, 2)};
`;
  await fs.writeFile(outPath, content, 'utf8');
  console.log(`\n📋 Gallery list updated: src/galleryImages.generated.js (${entries.length} image(s))`);
}

// Run the script
processImages().catch(error => {
  console.error('\n✗ Fatal error:', error);
  process.exit(1);
});

