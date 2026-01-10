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
  thumbnailWidth: 600,
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
    const { width, quality, format = 'jpeg' } = options;
    
    let pipeline = sharp(inputPath);
    
    if (width) {
      pipeline = pipeline.resize(width, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
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
 * Returns true nếu cả thumbnail và full-size đều tồn tại và mới hơn (hoặc bằng) input file
 */
async function isImageAlreadyOptimized(inputPath, thumbnailPath, fullPath) {
  try {
    const inputTime = await getFileModifiedTime(inputPath);
    const thumbnailTime = await getFileModifiedTime(thumbnailPath);
    const fullTime = await getFileModifiedTime(fullPath);
    
    // Nếu cả 2 output files đều tồn tại và mới hơn (hoặc bằng) input file
    if (thumbnailTime >= inputTime && fullTime >= inputTime) {
      return true;
    }
    
    return false;
  } catch {
    // Nếu không kiểm tra được (file không tồn tại), return false
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
    
    // Output filenames (convert to .jpg for thumbnails)
    // Giữ tên file gốc để tránh conflict nếu có nhiều ảnh cùng tên ở các thư mục khác nhau
    const safeBaseName = relativePath.replace(/[^a-zA-Z0-9]/g, '_').replace(/\.[^/.]+$/, '');
    const thumbnailName = `${safeBaseName}.jpg`;
    const fullName = `${safeBaseName}${ext === '.png' ? '.png' : '.jpg'}`;
    
    const thumbnailPath = path.join(CONFIG.thumbnailsDir, thumbnailName);
    const optimizedFullPath = path.join(CONFIG.fullDir, fullName);
    
    try {
      // Get original file size
      const originalSize = parseFloat(await getFileSize(inputImagePath));
      stats.totalOriginalSize += originalSize;
      
      // Kiểm tra xem đã được optimize chưa
      const alreadyOptimized = await isImageAlreadyOptimized(inputImagePath, thumbnailPath, optimizedFullPath);
      
      if (alreadyOptimized) {
        // Đã được optimize rồi, skip và load stats từ files đã có
        const thumbSize = parseFloat(await getFileSize(thumbnailPath));
        const fullSize = parseFloat(await getFileSize(optimizedFullPath));
        stats.totalThumbnailSize += thumbSize;
        stats.totalFullSize += fullSize;
        skippedCount++;
        console.log(`⏭️  Skipped (already optimized): ${relativePath} (${originalSize} MB)`);
        console.log(`   ✓ Thumbnail: ${thumbnailName} (${thumbSize} MB)`);
        console.log(`   ✓ Full-size: ${fullName} (${fullSize} MB)\n`);
        continue;
      }
      
      console.log(`Processing: ${relativePath} (${originalSize} MB)`);
      
      // Generate thumbnail
      const thumbSuccess = await optimizeImage(inputImagePath, thumbnailPath, {
        width: CONFIG.thumbnailWidth,
        quality: CONFIG.thumbnailQuality,
        format: 'jpeg'
      });
      
      if (thumbSuccess) {
        const thumbSize = parseFloat(await getFileSize(thumbnailPath));
        stats.totalThumbnailSize += thumbSize;
        console.log(`  ✓ Thumbnail: ${thumbnailName} (${thumbSize} MB)`);
      }
      
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
          console.log(`  📊 Size reduction: ${reduction}%\n`);
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
  console.log('\n📝 Next steps:');
  console.log('  1. Update GALLERY_IMAGES in Gallery.jsx with your image filenames');
  console.log('  2. Example format:');
  console.log('     { src: "/filename.jpg", alt: "Description" }');
  console.log('\n');
}

// Run the script
processImages().catch(error => {
  console.error('\n✗ Fatal error:', error);
  process.exit(1);
});

