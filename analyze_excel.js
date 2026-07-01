const xlsx = require('xlsx');
const path = require('path');

const dir = 'C:\\Users\\Admin\\.gemini\\antigravity\\scratch\\ERP-FireBase-VERCEL-Gonzales\\Datos Excel';

function analyzeFile(filename, sheetName) {
  try {
    console.log(`\n--- Analyzing ${filename} (${sheetName || 'First Sheet'}) ---`);
    const filePath = path.join(dir, filename);
    const workbook = xlsx.readFile(filePath);
    const targetSheetName = sheetName || workbook.SheetNames[0];
    const sheet = workbook.Sheets[targetSheetName];
    
    if (!sheet) {
      console.log(`Sheet ${targetSheetName} not found. Available sheets:`, workbook.SheetNames);
      return;
    }

    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    if (data.length === 0) {
      console.log('Sheet is empty');
      return;
    }

    const headers = data[0];
    console.log('Headers:', headers);
    
    console.log('\nSample Row 1:');
    if (data.length > 1) console.log(data[1]);

    console.log(`\nTotal rows: ${data.length}`);
  } catch (err) {
    console.error(`Error processing ${filename}:`, err.message);
  }
}

analyzeFile('BBDD_Despacho.xlsx', 'DB_Inventario');
analyzeFile('BBDD_Retail.xlsx');
