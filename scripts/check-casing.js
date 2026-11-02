const fs = require('fs');
const path = require('path');

/**
 * Checks all relative TypeScript imports in src/ against disk
 * to prevent Linux build failures caused by case sensitivity differences.
 */
function checkDirectory(dir) {
  let hasErrors = false;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
        const subHasErrors = checkDirectory(fullPath);
        if (subHasErrors) hasErrors = true;
      }
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Match ES imports: from "./path" or import "./path"
      const importRegex = /(?:import\s+(?:[\s\S]*?from\s+)?|export\s+(?:[\s\S]*?from\s+)?|require\s*\(\s*)["'](\.[^"']+)["']/g;
      let match;

      while ((match = importRegex.exec(content)) !== null) {
        const importSpecifier = match[1];
        const targetResolved = path.resolve(dir, importSpecifier);
        const targetDir = path.dirname(targetResolved);
        const targetBase = path.basename(targetResolved);

        if (!fs.existsSync(targetDir)) {
          console.error(`[Casing Error] In ${fullPath}: Directory does not exist on disk: "${targetDir}"`);
          hasErrors = true;
          continue;
        }

        const dirContents = fs.readdirSync(targetDir);
        const exactMatch = dirContents.some((file) => {
          if (file === targetBase) return true;
          if (file === `${targetBase}.ts`) return true;
          if (file === `${targetBase}.js`) return true;
          if (file === `${targetBase}.d.ts`) return true;
          if (file === targetBase && fs.existsSync(path.join(targetDir, targetBase, 'index.ts'))) return true;
          return false;
        });

        if (!exactMatch) {
          console.error(`[Casing Error] In ${fullPath}: Import specifier "${importSpecifier}" does not match case of file in directory "${targetDir}"`);
          console.error(`  Available entries: ${dirContents.join(', ')}`);
          hasErrors = true;
        }
      }
    }
  }

  return hasErrors;
}

const srcDir = path.resolve(__dirname, '..', 'src');
console.log(`Auditing relative imports in: ${srcDir}`);
const errorsFound = checkDirectory(srcDir);

if (errorsFound) {
  console.error('\nFAIL: Case sensitivity errors found in relative TypeScript imports.');
  process.exit(1);
} else {
  console.log('SUCCESS: All relative TypeScript imports match exact file casing for Linux.');
  process.exit(0);
}
