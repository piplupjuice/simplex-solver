import React, { useState, useEffect } from 'react';
import { Plus, Minus, Calculator } from 'lucide-react';

const InputForm = ({ onSolve }) => {
  const [numVars, setNumVars] = useState(2);
  const [numConstraints, setNumConstraints] = useState(3);
  const [type, setType] = useState('maximize');
  
  const [objective, setObjective] = useState(Array(5).fill(0));
  const [constraints, setConstraints] = useState(
    Array(10).fill(null).map(() => ({ coeffs: Array(5).fill(0), type: '<=', rhs: 0 }))
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('type')) {
      const pType = params.get('type');
      setType(pType);
      
      const pVars = parseInt(params.get('vars') || '2');
      const pCons = parseInt(params.get('cons') || '3');
      setNumVars(pVars);
      setNumConstraints(pCons);

      const pObj = params.get('obj');
      if (pObj) {
        const objArr = pObj.split(',').map(Number);
        const newObj = Array(5).fill(0);
        objArr.forEach((v, i) => { if (i < 5) newObj[i] = v; });
        setObjective(newObj);
      }

      const newC = Array(10).fill(null).map(() => ({ coeffs: Array(5).fill(0), type: '<=', rhs: 0 }));
      for (let i = 0; i < pCons; i++) {
        const cRow = params.get(`c${i}`);
        if (cRow) {
          const parts = cRow.split(',');
          const rhs = Number(parts.pop());
          let cType = '<=';
          if (['<=', '>=', '='].includes(parts[parts.length - 1])) {
            cType = parts.pop();
          }
          parts.forEach((v, j) => { if (j < 5) newC[i].coeffs[j] = Number(v); });
          newC[i].type = cType;
          newC[i].rhs = rhs;
        }
      }
      setConstraints(newC);
      
      // Auto-trigger solve after a brief delay so App receives the callback
      setTimeout(() => {
        document.getElementById('solve-btn')?.click();
      }, 100);
    }
  }, []);

  const handleObjChange = (idx, value) => {
    const newObj = [...objective];
    newObj[idx] = value;
    setObjective(newObj);
  };

  const handleConstChange = (rIdx, cIdx, value) => {
    const newC = [...constraints];
    newC[rIdx].coeffs[cIdx] = value;
    setConstraints(newC);
  };

  const handleTypeChange = (rIdx, value) => {
    const newC = [...constraints];
    newC[rIdx].type = value;
    setConstraints(newC);
  };

  const handleRhsChange = (rIdx, value) => {
    const newC = [...constraints];
    newC[rIdx].rhs = value;
    setConstraints(newC);
  };

  const loadExample = (id) => {
    if (id === 1) {
      setType('maximize');
      setNumVars(2); setNumConstraints(3);
      setObjective([3, 5, 0, 0, 0]);
      setConstraints([
        { coeffs: [1, 0, 0, 0, 0], type: '<=', rhs: 4 },
        { coeffs: [0, 2, 0, 0, 0], type: '<=', rhs: 12 },
        { coeffs: [3, 2, 0, 0, 0], type: '<=', rhs: 18 },
        ...Array(7).fill(null).map(() => ({ coeffs: Array(5).fill(0), type: '<=', rhs: 0 }))
      ]);
    } else if (id === 2) {
      setType('minimize');
      setNumVars(2); setNumConstraints(2);
      setObjective([-2, -3, 0, 0, 0]); 
      setConstraints([
        { coeffs: [1, 1, 0, 0, 0], type: '<=', rhs: 10 },
        { coeffs: [2, 1, 0, 0, 0], type: '<=', rhs: 15 },
        ...Array(8).fill(null).map(() => ({ coeffs: Array(5).fill(0), type: '<=', rhs: 0 }))
      ]);
    } else if (id === 3) {
      setType('maximize');
      setNumVars(3); setNumConstraints(3);
      setObjective([5, 4, 3, 0, 0]);
      setConstraints([
        { coeffs: [2, 3, 1, 0, 0], type: '<=', rhs: 5 },
        { coeffs: [4, 1, 2, 0, 0], type: '<=', rhs: 11 },
        { coeffs: [3, 4, 2, 0, 0], type: '<=', rhs: 8 },
        ...Array(7).fill(null).map(() => ({ coeffs: Array(5).fill(0), type: '<=', rhs: 0 }))
      ]);
    }
  };

  // Prevent Array(NaN) or negative length crashes when inputs are empty
  const safeNumVars = Math.max(2, Math.min(5, parseInt(numVars) || 2));
  const safeNumCons = Math.max(1, Math.min(10, parseInt(numConstraints) || 1));

  const handleSubmit = (e) => {
    e.preventDefault();
    const activeObjective = objective.slice(0, safeNumVars).map(v => parseFloat(v) || 0);
    const activeConstraints = constraints.slice(0, safeNumCons).map(c => ({
      coeffs: c.coeffs.slice(0, safeNumVars).map(v => parseFloat(v) || 0),
      type: c.type || '<=', 
      rhs: parseFloat(c.rhs) || 0
    }));
    
    const params = new URLSearchParams();
    params.set('type', type);
    params.set('vars', safeNumVars.toString());
    params.set('cons', safeNumCons.toString());
    params.set('obj', activeObjective.join(','));
    activeConstraints.forEach((c, i) => {
      params.set(`c${i}`, [...c.coeffs, c.type, c.rhs].join(','));
    });
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);

    onSolve(type, activeObjective, activeConstraints);
  };

  return (
    <div className="card p-6 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-slate-700">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Calculator className="text-primary" />
          Problem Definition
        </h2>
        <div className="flex gap-2 text-sm font-medium">
          <span className="py-1 px-2 text-gray-400">Load Example:</span>
          <button type="button" onClick={() => loadExample(1)} className="bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 px-3 py-1 rounded transition-colors">2 Vars (Max)</button>
          <button type="button" onClick={() => loadExample(2)} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 px-3 py-1 rounded transition-colors">2 Vars (Min)</button>
          <button type="button" onClick={() => loadExample(3)} className="bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200 px-3 py-1 rounded transition-colors">3 Vars (Max)</button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Objective</label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full">
              <option value="maximize">Maximize (Z)</option>
              <option value="minimize">Minimize (Z)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Variables (max 5)</label>
            <div className="flex items-center gap-2">
              <input type="number" min="2" max="5" value={numVars} onChange={e => setNumVars(e.target.value)} className="w-full" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Constraints</label>
            <div className="flex items-center gap-2">
              <input type="number" min="1" max="10" value={numConstraints} onChange={e => setNumConstraints(e.target.value)} className="w-full" />
            </div>
          </div>
        </div>

        {/* Objective Function */}
        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
          <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">Objective Function</h3>
          <div className="flex items-center flex-wrap gap-2 text-lg">
            <span className="font-bold mr-2">{type === 'maximize' ? 'Max Z =' : 'Min Z ='}</span>
            {Array(safeNumVars).fill(0).map((_, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="font-medium text-gray-500">+</span>}
                <div className="flex items-center">
                  <input type="number" step="any" value={objective[i] === 0 ? '0' : objective[i]} onChange={e => handleObjChange(i, e.target.value)} className="w-20 text-right" placeholder="0" required />
                  <span className="ml-1 font-semibold text-gray-700 dark:text-gray-300">x<sub>{i + 1}</sub></span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Constraints */}
        <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
          <h3 className="font-semibold mb-3">Constraints</h3>
          <p className="text-sm text-gray-500 mb-4">Subject to:</p>
          <div className="space-y-3">
            {Array(safeNumCons).fill(0).map((_, rIdx) => (
              <div key={rIdx} className="flex items-center flex-wrap gap-2 text-lg">
                {Array(safeNumVars).fill(0).map((_, cIdx) => (
                  <React.Fragment key={cIdx}>
                    {cIdx > 0 && <span className="font-medium text-gray-400">+</span>}
                    <div className="flex items-center">
                      <input type="number" step="any" value={constraints[rIdx].coeffs[cIdx] === 0 ? '0' : constraints[rIdx].coeffs[cIdx]} onChange={e => handleConstChange(rIdx, cIdx, e.target.value)} className="w-16 text-right" placeholder="0" required />
                      <span className="ml-1 font-semibold text-gray-600 dark:text-gray-400">x<sub>{cIdx + 1}</sub></span>
                    </div>
                  </React.Fragment>
                ))}
                <select 
                  value={constraints[rIdx].type} 
                  onChange={e => handleTypeChange(rIdx, e.target.value)} 
                  className="mx-2 font-bold text-gray-500 bg-transparent border-0 border-b-2 border-gray-300 focus:border-primary focus:ring-0 p-1 min-w-[50px] text-center"
                >
                  <option value="<=">≤</option>
                  <option value="=">=</option>
                  <option value=">=">≥</option>
                </select>
                <input type="number" step="any" value={constraints[rIdx].rhs === 0 ? '0' : constraints[rIdx].rhs} onChange={e => handleRhsChange(rIdx, e.target.value)} className="w-20 text-right font-medium" placeholder="RHS" required />
              </div>
            ))}
            <div className="pt-2 text-sm text-gray-500 italics">
              x<sub>1</sub>, x<sub>2</sub>, ... x<sub>n</sub> ≥ 0
            </div>
          </div>
        </div>

        <button id="solve-btn" type="submit" className="primary w-full shadow-md hover:shadow-lg flex justify-center items-center gap-2 py-3 text-lg">
          <Calculator size={20} />
          Solve Problem
        </button>
      </form>
    </div>
  );
};

export default InputForm;
