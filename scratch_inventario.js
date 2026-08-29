const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'supabase', 'migrations');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql'));
const tables = new Set();
const tableDetails = {};

files.forEach(f => {
  const content = fs.readFileSync(path.join(dir, f), 'utf-8');
  const regex = /CREATE TABLE (?:IF NOT EXISTS )?(?:public\.)?([a-zA-Z0-9_]+)/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const table = match[1].toLowerCase();
    tables.add(table);
    if (!tableDetails[table]) tableDetails[table] = [];
    tableDetails[table].push(f);
  }
});

const sorted = Array.from(tables).sort();
console.log('TOTAL_TABLAS_ENCONTRADAS:', sorted.length);
sorted.forEach((t, i) => console.log(`${i+1}. ${t} -> ${tableDetails[t][0]}`));
