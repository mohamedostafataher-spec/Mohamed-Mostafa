import fs from 'fs';
import path from 'path';

let content = fs.readFileSync('src/services/db.ts', 'utf8');

// Replace standard `.then(({ data }) => { if (data) onSuccess(...) })` with a catch block
content = content.replace(
  /supabase\.from\('([^']+)'\)\.select\('\*'\)\.then\(\(\{ data \}\) => \{\s*if \(data\)(.*?)onSuccess\((.*?)\);\s*\}\);/g,
  "supabase.from('$1').select('*').then(({ data, error }) => { if (error) throw error; if (data) $2 onSuccess($3); }).catch((err) => { console.warn('Supabase fetch failed for \$1', err); /* fallback provided by state default */ });"
);

// We need to also fix `.order` variants
content = content.replace(
  /supabase\.from\('([^']+)'\)\.select\('\*'\)\.order\(([^)]+)\)\.then\(\(\{ data \}\) => \{\s*if \(data\)(.*?)onSuccess\((.*?)\);\s*\}\);/g,
  "supabase.from('$1').select('*').order($2).then(({ data, error }) => { if (error) throw error; if (data) $3 onSuccess($4); }).catch((err) => { console.warn('Supabase fetch failed for \$1', err); /* fallback provided by state default */ });"
);

fs.writeFileSync('src/services/db.ts', content, 'utf8');
console.log('Fixed promises in db.ts');
