const fs = require('fs');
const path = require('path');

// 讀取 package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const dependencies = Object.keys(packageJson.dependencies);

console.log('檢查依賴使用情況...\n');

const unused = [];
const used = [];

// 遞歸搜索文件內容
function searchInFiles(dir, pattern) {
  let count = 0;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      count += searchInFiles(filePath, pattern);
    } else if (/\.(tsx?|jsx?)$/.test(file)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const regex = new RegExp(`from ['"]${pattern.replace(/\//g, '\\/')}['"]`, 'g');
      const matches = content.match(regex);
      if (matches) {
        count += matches.length;
      }
    }
  }

  return count;
}

dependencies.forEach(dep => {
  const count = searchInFiles('./src', dep);

  if (count > 0) {
    used.push({ dep, count });
    console.log(`✓ ${dep}: ${count} 次使用`);
  } else {
    unused.push(dep);
    console.log(`✗ ${dep}: 未使用`);
  }
});

console.log('\n=== 總結 ===');
console.log(`使用中: ${used.length} 個`);
console.log(`未使用: ${unused.length} 個\n`);

if (unused.length > 0) {
  console.log('可移除的依賴:');
  unused.forEach(dep => console.log(`  - ${dep}`));

  console.log('\n執行移除命令:');
  console.log(`npm uninstall ${unused.join(' ')}`);
}
