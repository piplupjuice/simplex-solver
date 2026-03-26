import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { initializeTableau } from './src/utils/simplex.js';
import SimplexTableau from './src/components/SimplexTableau.jsx';

try {
  const c = [3, 5];
  const constrs = [
    { coeffs: [1, 0], type: '<=', rhs: 4 },
    { coeffs: [0, 2], type: '<=', rhs: 12 },
    { coeffs: [3, 2], type: '<=', rhs: 18 }
  ];
  let tab = initializeTableau('maximize', c, constrs);
  const element = React.createElement(SimplexTableau, { tableau: tab });
  const html = ReactDOMServer.renderToString(element);
  console.log("SUCCESS length:", html.length);
} catch (e) {
  require('fs').writeFileSync('stack.txt', e.stack);
}
