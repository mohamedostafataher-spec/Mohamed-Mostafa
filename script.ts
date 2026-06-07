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
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.json')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
files.push('./vite.config.ts');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('/assets/images/')) {
    content = content.replace(/\/assets\/images\//g, '/img/');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
