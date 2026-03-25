import React from 'react';

const FractionDisplay = ({ fraction }) => {
  // fraction is an instance of fraction.js
  const s = fraction.s.toString() === '-1' ? '-' : '';
  const n = fraction.n.toString();
  const d = fraction.d.toString();

  const isZero = n === '0';
  const isWhole = d === '1';

  if (isWhole || isZero) {
    return <span>{isZero ? '0' : s + n}</span>;
  }
  
  return (
    <div className="fraction">
      <span className="numerator">
        {s + n}
      </span>
      <span className="denominator">
        {d}
      </span>
    </div>
  );
};

export default FractionDisplay;
