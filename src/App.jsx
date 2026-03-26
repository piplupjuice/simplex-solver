import React, { useState, useEffect } from 'react';
import { initializeTableau, iterateSimplex } from './utils/simplex';
import InputForm from './components/InputForm';
import SimplexTableau from './components/SimplexTableau';
import Narrator from './components/Narrator';
import FeasibleRegion2D from './components/FeasibleRegion2D';
import FeasibleRegion3D from './components/FeasibleRegion3D';
import { Moon, Sun, Play, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Fraction from 'fraction.js';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [problemConfig, setProblemConfig] = useState(null);

  // Apply dark mode class
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const handleSolve = (type, objective, constraints) => {
    const tableaus = [];
    setProblemConfig({ constraints }); // for the 2D plot

    let currTableau = initializeTableau(type, objective, constraints);
    tableaus.push(currTableau);

    // Hard limit iterations to prevent infinite loops (e.g. degeneracy cycling without Bland's rule)
    let iter = 0;
    while (!currTableau.isOptimal && !currTableau.isUnbounded && !currTableau.isInfeasible && iter < 30) {
      currTableau = iterateSimplex(currTableau);
      tableaus.push(currTableau);
      iter++;
    }

    setHistory(tableaus);
    setStepIndex(0);
  };

  const curr = history[stepIndex];

  return (
    <div className="min-h-screen pb-12 transition-colors duration-300">
      <header className="bg-white dark:bg-slate-900 shadow-sm border-b dark:border-slate-800 sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-primary">Simplex</span> Solver
            </h1>
          </div>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Theme"
          >
            {darkMode ? <Sun className="text-yellow-400" /> : <Moon className="text-slate-600" />}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        {!history.length ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Instructions</h3>
              <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-400 space-y-1">
                <li>Select Objective Type (Maximize/Minimize)</li>
                <li>Set the number of Decision Variables and Constraints</li>
                <li>Enter the coefficients as whole numbers, decimals, or fractions</li>
                <li>Click "Solve Problem" to generate the step-by-step tableaus</li>
              </ul>
            </div>
            <InputForm onSolve={handleSolve} />
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-between items-center mb-6">
              <button onClick={() => {
                setHistory([]);
                window.history.pushState({}, '', window.location.pathname);
              }} className="flex items-center gap-2 text-primary hover:text-primary-hover font-medium">
                <RotateCcw size={18} /> New Problem
              </button>
              
              {/* Stepper Controls */}
              <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border dark:border-slate-700">
                <button 
                  disabled={stepIndex === 0}
                  onClick={() => setStepIndex(s => s - 1)}
                  className="p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <SkipBack size={20} />
                </button>
                <span className="font-mono text-sm min-w-[100px] text-center font-medium">
                  Step {stepIndex} / {history.length - 1}
                </span>
                <button 
                  disabled={stepIndex === history.length - 1}
                  onClick={() => setStepIndex(s => s + 1)}
                  className="p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <SkipForward size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={stepIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <SimplexTableau tableau={curr} />
                  <Narrator tableau={curr} />
                </motion.div>
              </AnimatePresence>

              {(curr.isOptimal || curr.isUnbounded || curr.isInfeasible) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`card p-6 border-l-4 shadow-sm ${curr.isOptimal ? 'border-l-green-500 bg-green-50/50 dark:bg-green-900/10 text-green-900 dark:text-green-100' : 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10 text-red-900 dark:text-red-100'}`}
                >
                  <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                    {curr.isOptimal ? '🎉 Optimal Solution Reached' : (curr.isInfeasible ? '⚠️ Problem is Infeasible' : '⚠️ Problem is Unbounded')}
                  </h3>
                  
                  {curr.isOptimal && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {curr.origVars.map((v) => {
                          const rIdx = curr.basicVars.indexOf(v);
                          const valStr = rIdx !== -1 
                            ? curr.matrix[rIdx][curr.matrix[rIdx].length - 1].toFraction() 
                            : '0';
                          return (
                            <div key={v} className={`bg-white dark:bg-slate-800 p-3 rounded shadow-sm flex flex-col items-center ${valStr === '0' ? 'opacity-70' : ''}`}>
                              <span className="text-xs text-gray-500 uppercase tracking-wide">
                                {v} {valStr === '0' && <span className="lowercase text-[10px] ml-1">(not used in optimal solution)</span>}
                              </span>
                              <span className="text-lg font-bold">{valStr}</span>
                            </div>
                          );
                        })}
                        <div className="bg-white dark:bg-slate-800 p-3 rounded shadow-sm flex flex-col items-center col-span-2 md:col-span-1 border-2 border-primary/20">
                          <span className="text-xs text-primary uppercase tracking-wide font-bold">Optimal Z</span>
                          <span className="text-xl font-black text-primary">
                            {curr.zRow[curr.zRow.length - 1].toFraction()}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white/60 dark:bg-slate-800/60 p-4 rounded border border-gray-200 dark:border-slate-700">
                        <h4 className="font-bold mb-3 border-b pb-2 dark:border-slate-700">Constraint Verification</h4>
                        <ul className="space-y-2 font-mono text-sm">
                          {problemConfig.constraints.map((c, i) => {
                            let lhsVal = new Fraction(0);
                            const activeVars = [];
                            c.coeffs.forEach((coeff, j) => {
                              const varName = `x${j + 1}`;
                              const rIdx = curr.basicVars.indexOf(varName);
                              if (rIdx !== -1) {
                                const varVal = curr.matrix[rIdx][curr.matrix[rIdx].length - 1];
                                lhsVal = lhsVal.add(varVal.mul(coeff));
                                if (coeff !== 0) {
                                  activeVars.push(`${coeff}(${varVal.toFraction()})`);
                                }
                              } else {
                                if (coeff !== 0) activeVars.push(`${coeff}(0)`);
                              }
                            });
                            
                            const lhsStr = lhsVal.toFraction();
                            let isSatisfied = false;
                            if (c.type === '<=') isSatisfied = lhsVal.compare(c.rhs) <= 0;
                            else if (c.type === '>=') isSatisfied = lhsVal.compare(c.rhs) >= 0;
                            else isSatisfied = lhsVal.compare(c.rhs) === 0;

                            return (
                              <li key={i} className="flex items-start gap-2 border-b border-gray-100 dark:border-slate-700/50 pb-2 last:border-0 last:pb-0">
                                <span className={isSatisfied ? 'text-green-500' : 'text-red-500'}>{isSatisfied ? '✅' : '❌'}</span>
                                <div>
                                  <div className="text-gray-800 dark:text-gray-200">
                                    {activeVars.join(' + ') || '0'} = <span className="font-bold">{lhsStr}</span>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Constraint {i + 1}: Required {lhsStr} {c.type} {c.rhs}
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      <div className="text-sm bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded">
                        <strong>Summary: </strong> To {curr.type} Z, set {
                          curr.origVars.filter(v => v.startsWith('x')).map(v => {
                            const rIdx = curr.basicVars.indexOf(v);
                            return `${v}=${rIdx !== -1 ? curr.matrix[rIdx][curr.matrix[rIdx].length - 1].toFraction() : '0'}`;
                          }).join(', ')
                        } for a {curr.type === 'maximize' ? 'maximum' : 'minimum'} value of {curr.zRow[curr.zRow.length - 1].toFraction()}.
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* 2D Plot for 2 variables */}
            {problemConfig && problemConfig.constraints[0].coeffs.length === 2 && (
              <FeasibleRegion2D constraints={problemConfig.constraints} tableau={curr} />
            )}
            
            {/* 3D Plot for 3 variables */}
            {problemConfig && problemConfig.constraints[0].coeffs.length === 3 && (
              <FeasibleRegion3D constraints={problemConfig.constraints} tableau={curr} />
            )}

            {/* Disclaimer for >3 variables */}
            {problemConfig && problemConfig.constraints[0].coeffs.length > 3 && (
              <div className="card p-6 mt-6 shadow-sm border-dashed border-gray-300 dark:border-slate-600 bg-gray-50/50 dark:bg-slate-800/50 text-center">
                <h3 className="font-bold text-lg mb-2 text-gray-600 dark:text-gray-400">Graphical View Unavailable</h3>
                <p className="text-sm text-gray-500">
                  The feasible region graph is explicitly supported only for 2 and 3 variable problems. 
                  Visualizing {problemConfig.constraints[0].coeffs.length}D intersections is mathematically difficult to display on a 2D screen without heavy physics software.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </main>

      <footer className="fixed bottom-4 right-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 dark:border-slate-800 shadow-sm z-50">
        <span>Created by <span className="font-semibold text-gray-800 dark:text-gray-200">piplupJuice</span></span>
        <a 
          href="https://github.com/piplupjuice" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-primary transition-colors opacity-80 hover:opacity-100 hover:scale-110 transform duration-200 flex items-center"
          title="View GitHub Profile"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.24c3-.34 6-1.53 6-6.76a1.5 1.5 0 0 0-.44-1.06 1.5 1.5 0 0 0-.04-1.04s-.36-.11-1.18.44a4.1 4.1 0 0 0-2.14-.3 4.1 4.1 0 0 0-2.14.3C10.66 9.17 10.3 9.28 10.3 9.28a1.5 1.5 0 0 0-.04 1.04 1.5 1.5 0 0 0-.44 1.06c0 5.22 3 6.42 6 6.76-.38.33-.7.86-.88 1.48-.8.36-2.58.82-3.72-1.06-1.12-1.84-3-1.84-3-1.84-.71 0-.11.5.11.75 1.34 1.48 2 3.82 2 3.82 1.43 1 3.28.66 4.1.48v2.74"></path></svg>
        </a>
      </footer>
    </div>
  );
}

export default App;
