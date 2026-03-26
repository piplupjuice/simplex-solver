import Fraction from 'fraction.js';

export class MValue {
  constructor(m, c) {
    this.m = m instanceof Fraction ? m.clone() : new Fraction(m);
    this.c = c instanceof Fraction ? c.clone() : new Fraction(c);
  }

  clone() {
    return new MValue(this.m, this.c);
  }

  add(other) {
    if (other instanceof Fraction) return new MValue(this.m, this.c.add(other));
    if (!(other instanceof MValue)) other = new MValue(0, other);
    return new MValue(this.m.add(other.m), this.c.add(other.c));
  }

  sub(other) {
    if (other instanceof Fraction) return new MValue(this.m, this.c.sub(other));
    if (!(other instanceof MValue)) other = new MValue(0, other);
    return new MValue(this.m.sub(other.m), this.c.sub(other.c));
  }

  mul(scalar) {
    let s;
    if (scalar instanceof Fraction) s = scalar;
    else if (scalar instanceof MValue && scalar.m.valueOf() === 0) s = scalar.c;
    else s = new Fraction(scalar);
    return new MValue(this.m.mul(s), this.c.mul(s));
  }

  div(scalar) {
    let s;
    if (scalar instanceof Fraction) s = scalar;
    else if (scalar instanceof MValue && scalar.m.valueOf() === 0) s = scalar.c;
    else s = new Fraction(scalar);
    return new MValue(this.m.div(s), this.c.div(s));
  }

  compare(other) {
    let o = other instanceof MValue ? other : new MValue(0, other);
    const mCmp = this.m.compare(o.m);
    if (mCmp !== 0) return mCmp;
    return this.c.compare(o.c);
  }

  toFraction() {
    if (this.m.valueOf() === 0) return this.c.toFraction();
    if (this.c.valueOf() === 0) {
      if (this.m.valueOf() === 1) return "M";
      if (this.m.valueOf() === -1) return "-M";
      return `${this.m.toFraction()}M`;
    }
    
    const mStr = this.m.valueOf() === 1 ? "M" : (this.m.valueOf() === -1 ? "-M" : `${this.m.toFraction()}M`);
    const cStr = this.c.valueOf() > 0 ? `+${this.c.toFraction()}` : this.c.toFraction();
    return `${mStr}${cStr}`;
  }

  valueOf() {
    return this.m.valueOf() * 10000000 + this.c.valueOf();
  }
}

export const initializeTableau = (type, objectiveCoeffs, constraints) => {
  const normalizedConstraints = constraints.map(c => {
    let newCoeffs = [...c.coeffs];
    let newRhs = c.rhs;
    let newType = c.type;
    
    if (newRhs < 0) {
      newCoeffs = newCoeffs.map(coeff => -coeff);
      newRhs = -newRhs;
      if (newType === '<=') newType = '>=';
      else if (newType === '>=') newType = '<=';
    }
    
    return { coeffs: newCoeffs, type: newType, rhs: newRhs, originalType: c.type, originalRhs: c.rhs };
  });

  const numVars = objectiveCoeffs.length;
  let numSlack = 0;
  let numSurplus = 0;
  let numArtificial = 0;
  
  const isMax = type === 'maximize';

  normalizedConstraints.forEach((c) => {
    if (c.type === '<=') numSlack++;
    else if (c.type === '>=') { numSurplus++; numArtificial++; }
    else if (c.type === '=') numArtificial++;
  });

  const headers = ['Basis'];
  for (let i = 1; i <= numVars; i++) headers.push(`x${i}`);
  for (let i = 1; i <= numSlack; i++) headers.push(`s${i}`);
  for (let i = 1; i <= numSurplus; i++) headers.push(`e${i}`);
  for (let i = 1; i <= numArtificial; i++) headers.push(`a${i}`);
  headers.push('RHS');

  const origVars = [];
  for (let i = 1; i <= numVars; i++) origVars.push(`x${i}`);
  for (let i = 1; i <= numSlack; i++) origVars.push(`s${i}`);
  for (let i = 1; i <= numSurplus; i++) origVars.push(`e${i}`);

  const matrix = [];
  const basicVars = [];
  
  let sIdx = 0, eIdx = 0, aIdx = 0;
  normalizedConstraints.forEach(c => {
    const row = [];
    c.coeffs.forEach(coeff => row.push(new MValue(0, coeff)));
    
    // Slacks
    for (let j = 0; j < numSlack; j++) row.push(new MValue(0, c.type === '<=' && j === sIdx ? 1 : 0));
    // Surplus
    for (let j = 0; j < numSurplus; j++) row.push(new MValue(0, c.type === '>=' && j === eIdx ? -1 : 0));
    // Artificial
    for (let j = 0; j < numArtificial; j++) row.push(new MValue(0, (c.type === '>=' || c.type === '=') && j === aIdx ? 1 : 0));
    
    row.push(new MValue(0, c.rhs));
    matrix.push(row);
    
    if (c.type === '<=') {
      basicVars.push(`s${sIdx + 1}`);
      sIdx++;
    } else if (c.type === '>=') {
      basicVars.push(`a${aIdx + 1}`);
      eIdx++; aIdx++;
    } else if (c.type === '=') {
      basicVars.push(`a${aIdx + 1}`);
      aIdx++;
    }
  });

  // Setup original Z row : Z - c*x = 0 -> Push -c_j
  const zRow = [];
  objectiveCoeffs.forEach(coeff => {
    zRow.push(new MValue(0, -coeff));
  });
  
  for (let j = 0; j < numSlack; j++) zRow.push(new MValue(0, 0));
  for (let j = 0; j < numSurplus; j++) zRow.push(new MValue(0, 0));
  
  // Big-M penalties in Z-row array
  for (let j = 0; j < numArtificial; j++) {
    zRow.push(new MValue(isMax ? 1 : -1, 0));
  }
  zRow.push(new MValue(0, 0)); // RHS

  // Row Zero Normalization for Artificial Variables
  for (let i = 0; i < basicVars.length; i++) {
    if (basicVars[i].startsWith('a')) {
      const aColIdx = headers.indexOf(basicVars[i]) - 1;
      const factor = zRow[aColIdx];
      if (factor.compare(0) !== 0) {
        for (let j = 0; j < zRow.length; j++) {
          zRow[j] = zRow[j].sub(factor.mul(matrix[i][j]));
        }
      }
    }
  }

  const probSetup = [];
  if (numSlack > 0 || numSurplus > 0 || numArtificial > 0 || normalizedConstraints.some(c => c.originalRhs < 0)) {
    let constIdx = 1;
    normalizedConstraints.forEach(c => {
      let desc = `Constraint ${constIdx} `;
      if (c.originalRhs < 0) {
        desc += `(multiplied by -1 to make RHS positive -> ${c.type}): `;
      } else {
        desc += `(${c.type}): `;
      }
      
      if (c.type === '<=') desc += `Added Slack (s)`;
      else if (c.type === '>=') desc += `Subtracted Surplus (e), Added Artificial (a)`;
      else if (c.type === '=') desc += `Added Artificial (a)`;
      
      probSetup.push(desc);
      constIdx++;
    });
    if (numArtificial > 0) probSetup.push("Since Artificial variables were added, we configure a Massive Penalty (Big-M Method) to iteratively drive them to zero.");
  }

  const tab = {
    type,
    headers,
    origVars,
    matrix,
    zRow,
    basicVars,
    isOptimal: false,
    isUnbounded: false,
    isInfeasible: false,
    narration: "Initial tableau formulated.",
    probSetup,
    stepNumber: 0,
    ratioTest: [],
    currentSolution: ""
  };

  return identifyPivot(tab);
};

const buildCurrentSolution = (tableau) => {
  const vals = [];
  tableau.origVars.forEach((v) => {
    const rIdx = tableau.basicVars.indexOf(v);
    if (rIdx !== -1) {
      vals.push(`${v}=${tableau.matrix[rIdx][tableau.matrix[rIdx].length - 1].toFraction()}`);
    } else {
      vals.push(`${v}=0`);
    }
  });

  const zVal = tableau.zRow[tableau.zRow.length - 1].toFraction();
  vals.push(`Z=${zVal}`);
  return `Current solution: ${vals.join(', ')}`;
};

export const identifyPivot = (tableau) => {
  if (tableau.isOptimal || tableau.isUnbounded || tableau.isInfeasible) return tableau;

  const activeZRow = tableau.zRow;
  const isMaxPhase = tableau.type === 'maximize';
  
  let bestColVal = new MValue(0, 0);
  let pivotCol = -1;

  for (let j = 0; j < activeZRow.length - 1; j++) {
    const val = activeZRow[j];
    if (isMaxPhase) {
      if (val.compare(0) < 0 && val.compare(bestColVal) < 0) {
        bestColVal = val;
        pivotCol = j;
      }
    } else {
      if (val.compare(0) > 0 && val.compare(bestColVal) > 0) {
        bestColVal = val;
        pivotCol = j;
      }
    }
  }

  tableau.ratioTest = [];

  if (pivotCol === -1) {
    let artificialNonZero = false;
    for (let i = 0; i < tableau.basicVars.length; i++) {
       if (tableau.basicVars[i].startsWith('a') && tableau.matrix[i][tableau.matrix[i].length - 1].compare(0) > 0) {
           artificialNonZero = true;
           break;
       }
    }
    
    if (artificialNonZero) {
        tableau.isInfeasible = true;
        tableau.pivotCell = null;
        tableau.narration = "Result: The problem is Infeasible. Artificial variables could not be eliminated from the optimal basis.";
        tableau.currentSolution = buildCurrentSolution(tableau);
        return tableau;
    }

    tableau.isOptimal = true;
    tableau.pivotCell = null;
    tableau.narration = tableau.stepNumber === 0 
      ? "No improving values exist in the Objective row. The origin perfectly represents the Optimal Solution!"
      : "No improving values exist in the Objective row. We have successfully found the Optimal Solution!";
    tableau.currentSolution = buildCurrentSolution(tableau);
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
      const ratioNum = ratio.toFraction();
      
      let isStrictMin = false;
      if (minRatio === null || ratio.compare(minRatio) < 0) {
        minRatio = ratio;
        pivotRow = i;
        isStrictMin = true;
      } else if (ratio.compare(minRatio) === 0) {
        // Bland's rule tie-breaking
        if (tableau.basicVars[i] < tableau.basicVars[pivotRow]) {
          pivotRow = i;
          isStrictMin = true;
        }
      }

      tableau.ratioTest.push({
        row: i,
        basicVar: tableau.basicVars[i],
        rhs: rhs.toFraction(),
        elt: colVal.toFraction(),
        ratio: ratioNum,
        val: ratio,
        isMin: false // will be corrected below
      });
    } else {
      tableau.ratioTest.push({
        row: i,
        basicVar: tableau.basicVars[i],
        rhs: rhs.toFraction(),
        elt: colVal.toFraction(),
        ratio: '-',
        val: null,
        isMin: false
      });
    }
  }

  if (pivotRow === -1) {
    tableau.isUnbounded = true;
    tableau.pivotCell = null;
    tableau.narration = "Result: The problem is Unbounded.";
    tableau.currentSolution = buildCurrentSolution(tableau);
    return tableau;
  }

  // Mark the min in the ratio test array
  tableau.ratioTest.find(r => r.row === pivotRow).isMin = true;

  const enteringVar = tableau.headers[pivotCol + 1];
  const leavingVar = tableau.basicVars[pivotRow];

  tableau.pivotCell = { row: pivotRow, col: pivotCol };
  
  const adjective = isMaxPhase ? "negative" : "positive";
  const direction = isMaxPhase ? "increases" : "decreases";

  tableau.narration = `Step ${tableau.stepNumber + 1}: Variable ${enteringVar} enters because ${bestColVal.toFraction()} is the most ${adjective}, meaning it ${direction} Z the most. ${leavingVar} leaves. Pivot on element ${tableau.matrix[pivotRow][pivotCol].toFraction()}.`;
  tableau.currentSolution = buildCurrentSolution(tableau);

  return tableau;
};

export const iterateSimplex = (tableau) => {
  if (tableau.isOptimal || tableau.isUnbounded || tableau.isInfeasible) return tableau;

  const { row: pRow, col: pCol } = tableau.pivotCell;
  const pivotElt = tableau.matrix[pRow][pCol];
  
  const newMatrix = tableau.matrix.map(row => row.map(v => v.clone()));
  const newZRow = tableau.zRow.map(v => v.clone());
  const newBasicVars = [...tableau.basicVars];

  newBasicVars[pRow] = tableau.headers[pCol + 1];

  // Divide pivot row
  for (let j = 0; j < newMatrix[pRow].length; j++) {
    newMatrix[pRow][j] = newMatrix[pRow][j].div(pivotElt);
  }

  // Row operations for matrix
  for (let i = 0; i < newMatrix.length; i++) {
    if (i === pRow) continue;
    const factor = newMatrix[i][pCol];
    for (let j = 0; j < newMatrix[i].length; j++) {
      newMatrix[i][j] = newMatrix[i][j].sub(factor.mul(newMatrix[pRow][j]));
    }
  }

  // Row op for Phase 2 Z row
  const zFactor = newZRow[pCol];
  for (let j = 0; j < newZRow.length; j++) {
    newZRow[j] = newZRow[j].sub(zFactor.mul(newMatrix[pRow][j]));
  }

  return identifyPivot({
    type: tableau.type,
    headers: tableau.headers,
    origVars: tableau.origVars,
    matrix: newMatrix,
    zRow: newZRow,
    basicVars: newBasicVars,
    isOptimal: false,
    isUnbounded: false,
    isInfeasible: false,
    narration: "",
    probSetup: [], // Only needed for step 0
    ratioTest: [],
    stepNumber: tableau.stepNumber + 1
  });
};
