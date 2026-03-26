import { initializeTableau, iterateSimplex } from './src/utils/simplex.js';

try {
  const c = [5, 4];
  const constrs = [
    { coeffs: [1, 1], type: '=', rhs: 10 }
  ];
  let tab = initializeTableau('maximize', c, constrs);
  let iter = 0;
  console.log("INIT Z Row:", tab.zRow.map(v => v.toFraction()));
  while (!tab.isOptimal && !tab.isUnbounded && !tab.isInfeasible && iter < 10) {
    tab = iterateSimplex(tab);
    iter++;
  }
  const { buildCurrentSolution } = require('./src/utils/simplex.js') || {};
  // Wait, I can't require ES module natively easily sometimes. Let's just print final items.
  console.log("Final Phase:", tab.phase);
  console.log("Final isInfeasible:", tab.isInfeasible);
  console.log("Final isOptimal:", tab.isOptimal);
  console.log("Final Basis:", tab.basicVars);
  console.log("Final Matrix Rows RHS:");
  tab.matrix.forEach((r, i) => console.log(tab.basicVars[i], "=", r[r.length-1].toFraction()));
  console.log("Final Z:", tab.zRow[tab.zRow.length-1].toFraction());
} catch (e) {
  console.log(e.stack);
}
