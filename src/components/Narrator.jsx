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
  } else if (tableau.isUnbounded) {
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
      <div>
        <h4 className={`font-semibold mb-1 ${textClass}`}>
          Step {tableau.stepNumber === 0 ? 'Initialization' : tableau.stepNumber} Explanation
        </h4>
        <p className={`text-sm ${textClass} opacity-90 leading-relaxed`}>
          {tableau.narration}
        </p>
      </div>
    </motion.div>
  );
};

export default Narrator;
