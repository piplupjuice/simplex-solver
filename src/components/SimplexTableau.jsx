import React from 'react';
import { motion } from 'framer-motion';
import FractionDisplay from './FractionDisplay';

const SimplexTableau = ({ tableau }) => {
  if (!tableau) return null;

  const { headers, matrix, zRow, basicVars, pivotCell } = tableau;

  // Determine row/col classes based on pivot
  const getCellClass = (rIdx, cIdx) => {
    let classes = "transition-colors duration-300 relative ";
    if (!pivotCell) return classes;

    const isPivotCol = pivotCell.col === cIdx;
    const isPivotRow = pivotCell.row === rIdx;

    if (isPivotCol && isPivotRow) {
      classes += "bg-pivot-cell text-white font-bold "; // red
    } else if (isPivotRow) {
      classes += "bg-pivot-row "; // blue
    } else if (isPivotCol) {
      classes += "bg-pivot-col "; // amber
    }
    return classes;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card overflow-x-auto shadow-sm"
    >
      <table className="w-full text-sm">
        <thead className="bg-gray-100 dark:bg-slate-800 border-b border-gray-300 dark:border-slate-600">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-200">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
          {matrix.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
              <td className={`py-2 px-4 font-medium border-r border-gray-200 dark:border-slate-700 ${getCellClass(rIdx, -1)}`}>
                {basicVars[rIdx]}
              </td>
              {row.map((val, cIdx) => (
                <td key={cIdx} className={`py-2 px-4 ${getCellClass(rIdx, cIdx)}`}>
                  <FractionDisplay fraction={val} />
                </td>
              ))}
            </tr>
          ))}
          {/* Z-Row */}
          <tr className="bg-gray-50 dark:bg-slate-800/80 font-semibold border-t-2 border-gray-300 dark:border-slate-500">
            <td className="py-3 px-4 border-r border-gray-200 dark:border-slate-700 text-blue-600 dark:text-blue-400">
              Zj - Cj
            </td>
            {zRow.map((val, cIdx) => (
              <td key={cIdx} className="py-3 px-4">
                <FractionDisplay fraction={val} />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </motion.div>
  );
};

export default SimplexTableau;
