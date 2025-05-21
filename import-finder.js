
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

async function findImportPatterns(rootDir) {
  const patterns = {
    services: [],
    hooks: [],
    utils: [],
    types: []
  };
  
  async function processFile(filePath) {
    try {
      const fileExt = path.extname(filePath);
      if (!['.ts', '.tsx', '.js', '.jsx'].includes(fileExt)) return;
      
      const content = await readFile(filePath, 'utf8');
      
      // Find all import statements
      const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
      let match;
      
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        
        if (importPath.includes('@/services/')) {
          patterns.services.push({ file: filePath, import: importPath });
        }
        if (importPath.includes('@/hooks/')) {
          patterns.hooks.push({ file: filePath, import: importPath });
        }
        if (importPath.includes('@/utils/')) {
          patterns.utils.push({ file: filePath, import: importPath });
        }
        if (importPath.includes('@/types/')) {
          patterns.types.push({ file: filePath, import: importPath });
        }
      }
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
    }
  }
  
  async function traverseDirectory(dir) {
    try {
      const files = await readdir(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const fileStat = await stat(filePath);
        
        if (fileStat.isDirectory()) {
          // Skip node_modules and .next directories
          if (file !== 'node_modules' && file !== '.next' && file !== 'DİĞER' && file !== 'HATALAR' && file !== 'backup') {
            await traverseDirectory(filePath);
          }
        } else {
          await processFile(filePath);
        }
      }
    } catch (error) {
      console.error(`Error traversing directory ${dir}:`, error);
    }
  }
  
  await traverseDirectory(rootDir);
  return patterns;
}

// Execute and output results
(async () => {
  const rootDir = '/Users/serkan/Desktop/claude';
  const patterns = await findImportPatterns(rootDir);
  
  console.log('=== SERVICE IMPORTS ===');
  patterns.services.forEach(p => console.log(`${p.file}: ${p.import}`));
  
  console.log('\n=== HOOK IMPORTS ===');
  patterns.hooks.forEach(p => console.log(`${p.file}: ${p.import}`));
  
  console.log('\n=== UTILITY IMPORTS ===');
  patterns.utils.forEach(p => console.log(`${p.file}: ${p.import}`));
  
  console.log('\n=== TYPE IMPORTS ===');
  patterns.types.forEach(p => console.log(`${p.file}: ${p.import}`));
  
  console.log('\n=== SUMMARY ===');
  console.log(`Found ${patterns.services.length} service imports`);
  console.log(`Found ${patterns.hooks.length} hook imports`);
  console.log(`Found ${patterns.utils.length} utility imports`);
  console.log(`Found ${patterns.types.length} type imports`);
})();
