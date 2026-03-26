import { initializeTableau } from './src/utils/simplex.js';
import fs from 'fs';

try {
  const c = [3, 5];
  const constrs = [
    { coeffs: [1, 0], type: '<=', rhs: 4 },
    { coeffs: [0, 2], type: '<=', rhs: 12 },
    { coeffs: [3, 2], type: '<=', rhs: 18 }
  ];
  let tab = initializeTableau('maximize', c, constrs);
  fs.writeFileSync('tab.json', JSON.stringify(tab, null, 2));
  console.log("Wrote tab.json");
} catch (e) {
  console.log("CRASH:", e.stack);
}
