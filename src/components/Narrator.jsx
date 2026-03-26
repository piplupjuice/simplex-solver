import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, AlertCircle, CheckCircle } from 'lucide-react';

const Narrator = ({ tableau }) => {
  if (!tableau) return null;

  let icon = <BookOpen className="text-blue-500" />;
  let bgClass = "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
  let textClass = "text-blue-800 dark:text-blue-200";

  if (tableau.isOptimal) {
    icon = <CheckCircle className="text-green-500" />;
    bgClass = "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
    textClass = "text-green-800 dark:text-green-200";
  } else if (tableau.isUnbounded || tableau.isInfeasible) {
    icon = <AlertCircle className="text-red-500" />;
    bgClass = "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
    textClass = "text-red-800 dark:text-red-200";
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`mt-4 p-4 rounded-lg border flex gap-3 items-start shadow-sm ${bgClass}`}
    >
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div className="w-full">
        <h4 className={`font-semibold mb-2 ${textClass} flex items-center gap-2`}>
          Step {tableau.stepNumber === 0 ? 'Initialization' : tableau.stepNumber} Explanation
        </h4>
        
        {tableau.stepNumber === 0 && tableau.probSetup && tableau.probSetup.length > 0 && (
          <div className="mb-4 bg-white/50 dark:bg-slate-800/50 p-3 rounded text-sm text-gray-700 dark:text-gray-300 space-y-2 border border-blue-100 dark:border-slate-700">
            <h5 className="font-bold border-b border-gray-200 dark:border-slate-700 pb-1 mb-2">Problem Setup logic</h5>
            <ul className="list-disc pl-5 space-y-1">
              {tableau.probSetup.map((prob, i) => <li key={i}>{prob}</li>)}
            </ul>
          </div>
        )}

        <p className={`text-sm ${textClass} opacity-90 leading-relaxed mb-3`}>
          {tableau.narration}
        </p>

        {tableau.currentSolution && (
          <div className="mb-4 font-mono text-sm font-semibold bg-white/60 dark:bg-slate-800/60 inline-block px-3 py-1.5 rounded text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-slate-700">
            {tableau.currentSolution}
          </div>
        )}

        {tableau.ratioTest && tableau.ratioTest.length > 0 && (
          <div className="mt-4 border border-gray-200 dark:border-slate-700 rounded overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100/80 dark:bg-slate-800 text-gray-600 dark:text-gray-400">
                <tr>
                  <th className="px-3 py-2 border-b dark:border-slate-700 font-semibold w-24">Basic Var</th>
                  <th className="px-3 py-2 border-b dark:border-slate-700 font-semibold">RHS</th>
                  <th className="px-3 py-2 border-b dark:border-slate-700 font-semibold">Pivot Col elt</th>
                  <th className="px-3 py-2 border-b dark:border-slate-700 font-semibold">Ratio</th>
                </tr>
              </thead>
              <tbody>
                {tableau.ratioTest.map((rt, i) => (
                  <tr key={i} className={`border-b dark:border-slate-700/50 last:border-0 ${rt.isMin ? 'bg-red-50/70 dark:bg-red-900/20 font-medium text-red-800 dark:text-red-200' : 'bg-white/50 dark:bg-slate-900/30'}`}>
                    <td className="px-3 py-2">{rt.basicVar}</td>
                    <td className="px-3 py-2">{rt.rhs}</td>
                    <td className="px-3 py-2">{rt.elt}</td>
                    <td className="px-3 py-2">{rt.ratio} {rt.isMin && <span className="ml-2 text-xs uppercase bg-red-100 dark:bg-red-800/50 px-1.5 py-0.5 rounded text-red-700 dark:text-red-300">Minimum &amp; Leaving</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Narrator;
