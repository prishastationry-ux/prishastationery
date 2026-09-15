const fs = require('fs');

// Replace all occurrences of રમેશભાઈ with ભરતભાઈ in src/
const walkSync = (dir) => {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = dir + '/' + file;
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkSync(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('રમેશભાઈ')) {
        content = content.replace(/રમેશભાઈ/g, 'ભરતભાઈ');
        fs.writeFileSync(filePath, content);
        console.log('Updated:', filePath);
      }
    }
  });
};

walkSync('src');
