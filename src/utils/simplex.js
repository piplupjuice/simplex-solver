import Fraction from 'fraction.js';

/**
 * Initializes the first simplex tableau.
 * @param {string} type 'minimize' or 'maximize'
 * @param {Array<number>} objectiveCoeffs Array of coefficients for decision variables
 * @param {Array<Object>} constraints Array of { coeffs: number[], type: '<='|'>='|'=', rhs: number }
 * @returns {Object} Tableau state
 */
export const initializeTableau = (type, objectiveCoeffs, constraints) => {
  const numVars = objectiveCoeffs.length;
  let numSlack = 0;
  
  // Currently assuming standard canonical form where all constraints are <=
  // For a basic robust solver as requested, we handle <= with slacks.
  // The assignment likely focuses on basic Simplex (all <=). We'll assume slack variables for all.
  constraints.forEach((c) => {
    if (c.type === '<=') numSlack++;
  });

  const totalVars = numVars + numSlack;
  const headers = ['Basis'];
  for (let i = 1; i <= numVars; i++) headers.push(`x${i}`);
  for (let i = 1; i <= numSlack; i++) headers.push(`s${i}`);
  headers.push('RHS');

  const matrix = [];
  const basicVars = [];
  
  let slackIdx = 0;
  constraints.forEach((c, i) => {
    const row = [];
    c.coeffs.forEach(coeff => row.push(new Fraction(coeff)));
    
    // Add slacks
    for (let j = 0; j < numSlack; j++) {
      row.push(new Fraction(j === slackIdx ? 1 : 0));
    }
    
    row.push(new Fraction(c.rhs));
    matrix.push(row);
    basicVars.push(`s${slackIdx + 1}`);
    slackIdx++;
  });

  // Setup Z row
  const zRow = [];
  const isMax = type === 'maximize';
  
  objectiveCoeffs.forEach(coeff => {
    let val = new Fraction(coeff);
    if (isMax) val = val.mul(-1); // convert Max to Min internally
    zRow.push(val);
  });
  
  // Z row slack coeffs
  for (let j = 0; j < numSlack; j++) {
    zRow.push(new Fraction(0));
  }
  
  // Z row RHS
  zRow.push(new Fraction(0));

  return identifyPivot({
    headers,
    matrix,
    zRow,
    basicVars,
    isOptimal: false,
    isUnbounded: false,
    narration: "Initial tableau formulated. We converted Maximize to Minimize internally if needed.",
    stepNumber: 0
  });
};

/**
 * Identify the pivot row and column
 */
export const identifyPivot = (tableau) => {
  let minColVal = new Fraction(0);
  let pivotCol = -1;

  // Find most negative z-row coefficient
  for (let j = 0; j < tableau.zRow.length - 1; j++) { // exclude RHS
    if (tableau.zRow[j].compare(minColVal) < 0) {
      minColVal = tableau.zRow[j];
      pivotCol = j;
    }
  }

  if (pivotCol === -1) {
    tableau.isOptimal = true;
    tableau.pivotCell = null;
    tableau.narration = "All z-row coefficients are optimal (≥ 0). The current solution is optimal.";
    return tableau;
  }

  let minRatio = null;
  let pivotRow = -1;

  for (let i = 0; i < tableau.matrix.length; i++) {
    const row = tableau.matrix[i];
    const colVal = row[pivotCol];
    const rhs = row[row.length - 1];

    if (colVal.compare(0) > 0) {
      const ratio = rhs.div(colVal);
      if (minRatio === null || ratio.compare(minRatio) < 0) {
        minRatio = ratio;
        pivotRow = i;
      }
    }
  }

  if (pivotRow === -1) {
    tableau.isUnbounded = true;
    tableau.pivotCell = null;
    tableau.narration = `The most negative coefficient is in column ${tableau.headers[pivotCol + 1]}, but all entries in this column are ≤ 0. The problem is UNBOUNDED.`;
    return tableau;
  }

  const enteringVar = tableau.headers[pivotCol + 1];
  const leavingVar = tableau.basicVars[pivotRow];

  tableau.pivotCell = { row: pivotRow, col: pivotCol };
  tableau.narration = `Most negative z-row value is ${minColVal.toFraction()}, so ${enteringVar} enters. Minimum positive ratio is ${minRatio.toFraction()} in row ${pivotRow + 1}, so ${leavingVar} leaves. Pivot element is ${tableau.matrix[pivotRow][pivotCol].toFraction()}.`;
  
  return tableau;
};

/**
 * Perform one Simplex iteration (pivot operation)
 */
export const iterateSimplex = (tableau) => {
  if (tableau.isOptimal || tableau.isUnbounded) return tableau;

  const { row: pRow, col: pCol } = tableau.pivotCell;
  const pivotElt = tableau.matrix[pRow][pCol];
  
  const newMatrix = tableau.matrix.map(row => row.map(v => new Fraction(v)));
  const newZRow = tableau.zRow.map(v => new Fraction(v));
  const newBasicVars = [...tableau.basicVars];

  // Update basic variable
  newBasicVars[pRow] = tableau.headers[pCol + 1];

  // Divide pivot row by pivot element
  for (let j = 0; j < newMatrix[pRow].length; j++) {
    newMatrix[pRow][j] = newMatrix[pRow][j].div(pivotElt);
  }

  // Row operations for other rows
  for (let i = 0; i < newMatrix.length; i++) {
    if (i === pRow) continue;
    const factor = newMatrix[i][pCol];
    for (let j = 0; j < newMatrix[i].length; j++) {
      newMatrix[i][j] = newMatrix[i][j].sub(factor.mul(newMatrix[pRow][j]));
    }
  }

  // Row operation for Z row
  const zFactor = newZRow[pCol];
  for (let j = 0; j < newZRow.length; j++) {
    newZRow[j] = newZRow[j].sub(zFactor.mul(newMatrix[pRow][j]));
  }

  return identifyPivot({
    headers: tableau.headers,
    matrix: newMatrix,
    zRow: newZRow,
    basicVars: newBasicVars,
    isOptimal: false,
    isUnbounded: false,
    narration: "",
    stepNumber: tableau.stepNumber + 1
  });
};
