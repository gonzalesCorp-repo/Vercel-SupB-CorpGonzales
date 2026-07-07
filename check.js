const fs = require('fs');
const data = JSON.parse(fs.readFileSync('schema.json', 'utf8'));
const tables = data.definitions;
const withSedeId = [];
const withoutSedeId = [];

for (let t in tables) {
  if (tables[t].properties) {
    if (tables[t].properties['sede_id']) {
      withSedeId.push(t);
    } else {
      withoutSedeId.push(t);
    }
  }
}

console.log("Tablas CON sede_id:", withSedeId.join(", "));
console.log("Tablas SIN sede_id:", withoutSedeId.join(", "));
