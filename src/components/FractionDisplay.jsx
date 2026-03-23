import React from 'react';

const FractionDisplay = ({ fraction }) => {
  // fraction is an instance of fraction.js
  if (fraction.d === 1 || fraction.n === 0) {
    return <span>{fraction.n * fraction.s}</span>;
  }
  
  return (
    <div className="fraction">
      <span className="numerator">
        {fraction.n * fraction.s}
      </span>
      <span className="denominator">
        {fraction.d}
      </span>
    </div>
  );
};

export default FractionDisplay;
