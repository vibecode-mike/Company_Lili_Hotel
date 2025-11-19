const fs = require('fs');
const path = require('path');

// UI 組件列表
const uiComponents = fs.readdirSync('./src/components/ui')
  .filter(f => f.endsWith('.tsx'))
  .map(f => f.replace('.tsx', ''));

console.log(`共有 ${uiComponents.length} 個 UI 組件\n`);

// 搜索文件內容
function searchComponent(dir, componentName) {
  let count = 0;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && file !== 'ui') {
      count += searchComponent(filePath, componentName);
    } else if (/\.(tsx?|jsx?)$/.test(file) && !filePath.includes('components\\ui\\')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const regex = new RegExp(`from ['"]\\.\\./ui/${componentName}['"]|from ['"]@/components/ui/${componentName}['"]`, 'g');
      const matches = content.match(regex);
      if (matches) {
        count += matches.length;
      }
    }
  }

  return count;
}

const unused = [];
const used = [];

uiComponents.forEach(comp => {
  const count = searchComponent('./src', comp);

  if (count > 0) {
    used.push({ comp, count });
    console.log(`✓ ${comp}: ${count} 次使用`);
  } else {
    unused.push(comp);
    console.log(`✗ ${comp}: 未使用`);
  }
});

console.log('\n=== 總結 ===');
console.log(`使用中: ${used.length} 個`);
console.log(`未使用: ${unused.length} 個\n`);

if (unused.length > 0) {
  console.log('可刪除的 UI 組件:');
  unused.forEach(comp => console.log(`  src/components/ui/${comp}.tsx`));

  const totalSize = unused.length * 2; // 粗略估計每個文件 2KB
  console.log(`\n預計節省空間: ~${totalSize}KB`);
}
