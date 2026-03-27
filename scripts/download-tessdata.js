/**
 * 下载 Tesseract.js 语言包到本地
 * 解决 jsDelivr CDN 无法访问的问题
 * 用法: node scripts/download-tessdata.js
 */

const fetch = require('../node_modules/node-fetch');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const TESSDATA_DIR = path.join(__dirname, '..', 'public', 'tessdata');

// 确保目录存在
if (!fs.existsSync(TESSDATA_DIR)) {
  fs.mkdirSync(TESSDATA_DIR, { recursive: true });
}

/**
 * 从 npm 包 tarball 中提取 .traineddata 文件
 * 包结构: package/chi_sim.traineddata
 */
async function extractTraineddata(tgzPath, lang) {
  const outPath = path.join(TESSDATA_DIR, `${lang}.traineddata`);

  return new Promise((resolve, reject) => {
    const gunzip = zlib.createGunzip();
    const input = fs.createReadStream(tgzPath);

    // 简单的 tar 解析：找到 .traineddata 文件
    let buffer = Buffer.alloc(0);

    gunzip.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
    });

    gunzip.on('end', () => {
      // 在 tar 数据中查找文件名
      let pos = 0;
      let found = false;

      while (pos + 512 <= buffer.length) {
        // TAR header: 文件名在前100字节
        const header = buffer.slice(pos, pos + 512);
        const filename = header.slice(0, 100).toString('utf8').replace(/\0/g, '');

        if (!filename) break;

        // 读取文件大小（八进制字符串）
        const sizeStr = header.slice(124, 136).toString('utf8').replace(/\0/g, '').trim();
        const fileSize = parseInt(sizeStr, 8) || 0;

        const dataStart = pos + 512;
        const dataEnd = dataStart + fileSize;

        if (filename.endsWith('.traineddata')) {
          console.log(`  Found: ${filename} (${(fileSize / 1024 / 1024).toFixed(1)} MB)`);
          const data = buffer.slice(dataStart, dataEnd);
          fs.writeFileSync(outPath, data);
          console.log(`  Saved to: ${outPath}`);
          found = true;
          break;
        }

        // 移动到下一个 tar block（512字节对齐）
        const blocks = Math.ceil(fileSize / 512);
        pos += 512 + blocks * 512;
      }

      if (found) {
        resolve(outPath);
      } else {
        reject(new Error(`未找到 ${lang}.traineddata 文件`));
      }
    });

    gunzip.on('error', reject);
    input.pipe(gunzip);
  });
}

async function downloadLang(lang) {
  const outPath = path.join(TESSDATA_DIR, `${lang}.traineddata`);

  if (fs.existsSync(outPath)) {
    const size = fs.statSync(outPath).size;
    console.log(`[${lang}] 已存在 (${(size / 1024 / 1024).toFixed(1)} MB), 跳过`);
    return;
  }

  const url = `https://registry.npmmirror.com/@tesseract.js-data/${lang}/-/${lang}-1.0.0.tgz`;
  console.log(`[${lang}] 从 npmmirror 下载...`);
  console.log(`  URL: ${url}`);

  const tgzPath = path.join(TESSDATA_DIR, `${lang}-pkg.tgz`);

  try {
    const res = await fetch(url, { timeout: 120000 });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentLength = res.headers.get('content-length');
    const totalMB = contentLength ? (parseInt(contentLength) / 1024 / 1024).toFixed(1) : '?';
    console.log(`  文件大小: ${totalMB} MB`);

    // 下载到临时文件
    await new Promise((resolve, reject) => {
      const out = fs.createWriteStream(tgzPath);
      let downloaded = 0;
      res.body.on('data', (chunk) => {
        downloaded += chunk.length;
        process.stdout.write(`\r  下载进度: ${(downloaded / 1024 / 1024).toFixed(1)} MB`);
      });
      res.body.pipe(out);
      out.on('finish', () => { process.stdout.write('\n'); resolve(); });
      out.on('error', reject);
    });

    console.log(`  解压提取 .traineddata...`);
    await extractTraineddata(tgzPath, lang);

    // 清理临时文件
    fs.unlinkSync(tgzPath);
    console.log(`[${lang}] 完成!\n`);

  } catch (err) {
    console.error(`[${lang}] 失败:`, err.message);
    if (fs.existsSync(tgzPath)) fs.unlinkSync(tgzPath);
    throw err;
  }
}

async function main() {
  console.log('=== 下载 Tesseract 语言包 ===\n');

  const langs = ['chi_sim', 'eng'];

  for (const lang of langs) {
    await downloadLang(lang);
  }

  console.log('=== 全部完成! ===');
  console.log('语言包位置:', TESSDATA_DIR);
}

main().catch(err => {
  console.error('下载失败:', err);
  process.exit(1);
});
