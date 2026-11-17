const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let checkedCount = 0;
let errors = [];

function scan(dir) {
  const list = fs.readdirSync(dir);
  for (const f of list) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'client' && f !== 'dist') {
        scan(full);
      }
    } else if (f.endsWith('.js')) {
      checkedCount++;
      try {
        execSync(`node -c "${full}"`);
      } catch (err) {
        errors.push({ file: full, error: err.message });
      }
    }
  }
}

scan('.');
console.log(`[Syntax Check] Scanned ${checkedCount} JavaScript files.`);
if (errors.length > 0) {
  console.error('[Syntax Check] Found errors:', errors);
  process.exit(1);
} else {
  console.log('[Syntax Check] ALL JavaScript files passed syntax verification!');
  process.exit(0);
}

