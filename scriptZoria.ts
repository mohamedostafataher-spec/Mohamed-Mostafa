import fs from 'fs';
import path from 'path';

function walk(dir: string) {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.json') || file.endsWith('.html')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
files.push('./index.html');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let updated = false;
  
  if (content.match(/Zoria/ig)) {
    content = content.replace(/zoria/g, 'sulta');
    content = content.replace(/Zoria/g, 'Sulta');
    content = content.replace(/ZORIA/g, 'SULTA');
    content = content.replace(/zoria/ig, 'Sulta');
    updated = true;
  }
  
  if (updated) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
