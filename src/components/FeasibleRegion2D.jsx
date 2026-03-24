import React, { useMemo } from 'react';
import ReactPlot from 'react-plotly.js';
const Plot = ReactPlot.default || ReactPlot;

const FeasibleRegion2D = ({ constraints }) => {
  const plotData = useMemo(() => {
    if (!constraints || constraints.length === 0 || constraints[0].coeffs.length !== 2) {
      return null;
    }

    const lines = [
      // x = 0 (y-axis)
      { a: 1, b: 0, c: 0, type: '>=' },
      // y = 0 (x-axis)
      { a: 0, b: 1, c: 0, type: '>=' }
    ];

    constraints.forEach(c => {
      lines.push({
        a: c.coeffs[0],
        b: c.coeffs[1],
        c: c.rhs,
        type: '<=' // Assuming canonical form
      });
    });

    const validVertices = [];

    // Find intersections of all pairs of lines
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const l1 = lines[i];
        const l2 = lines[j];

        // Cramer's rule to solve:
        // a1*x + b1*y = c1
        // a2*x + b2*y = c2
        const det = l1.a * l2.b - l2.a * l1.b;
        if (Math.abs(det) > 1e-9) { // Lines are not parallel
          const x = (l1.c * l2.b - l2.c * l1.b) / det;
          const y = (l1.a * l2.c - l2.a * l1.c) / det;

          // Check if this intersection point is feasible (satisfies all inequalities)
          let feasible = true;
          for (let k = 0; k < lines.length; k++) {
            const lk = lines[k];
            const val = lk.a * x + lk.b * y;
            if (lk.type === '<=' && val > lk.c + 1e-6) feasible = false;
            if (lk.type === '>=' && val < lk.c - 1e-6) feasible = false;
          }

          if (feasible) {
            // Avoid adding duplicates
            const isDuplicate = validVertices.some(v => Math.abs(v.x - x) < 1e-5 && Math.abs(v.y - y) < 1e-5);
            if (!isDuplicate) {
              validVertices.push({ x, y });
            }
          }
        }
      }
    }

    if (validVertices.length < 3) return { lines, validVertices: [] };

    // Sort validVertices in counter-clockwise order
    const cx = validVertices.reduce((sum, v) => sum + v.x, 0) / validVertices.length;
    const cy = validVertices.reduce((sum, v) => sum + v.y, 0) / validVertices.length;

    validVertices.sort((A, B) => {
      return Math.atan2(A.y - cy, A.x - cx) - Math.atan2(B.y - cy, B.x - cx);
    });

    return { lines, validVertices };

  }, [constraints]);

  if (!plotData) {
    return (
      <div className="card p-6 mt-6 shadow-sm border-dashed border-gray-300 dark:border-slate-600 bg-gray-50/50 dark:bg-slate-800/50 text-center">
        <h3 className="font-bold text-lg mb-2 text-gray-600 dark:text-gray-400">Graphical View Unavailable</h3>
        <p className="text-sm text-gray-500">
          The feasible region graph is only available for 2-dimensional boundaries (2 variables). 
          Visualizing higher dimensions requires complex 3D or n-dimensional plotting outside the scope of this view.
        </p>
      </div>
    );
  }

  const { lines, validVertices } = plotData;

  // Compute bounding box for plotting extended bounds
  let maxX = 10;
  let maxY = 10;
  if (validVertices && validVertices.length > 0) {
    maxX = Math.max(...validVertices.map(v => v.x)) * 1.5;
    maxY = Math.max(...validVertices.map(v => v.y)) * 1.5;
  }
  // Ensure strict min bounds
  if (maxX <= 0) maxX = 10;
  if (maxY <= 0) maxY = 10;

  const getLinePoints = (line, maxX, maxY) => {
    // line: ax + by = c
    const pts = [];
    const eps = 1e-6;
    
    // Intersections with x=0, x=maxX, y=0, y=maxY
    // if a*x = c - b*y
    if (Math.abs(line.b) > eps) {
      // Intersect with x=0 => y = c/b
      const y0 = line.c / line.b;
      if (y0 >= -eps && y0 <= maxY + eps) pts.push({x:0, y:y0});
      
      // Intersect with x=maxX => y = (c - a*maxX)/b
      const yMax = (line.c - line.a * maxX) / line.b;
      if (yMax >= -eps && yMax <= maxY + eps) pts.push({x:maxX, y:yMax});
    }

    if (Math.abs(line.a) > eps) {
      // Intersect with y=0 => x = c/a
      const x0 = line.c / line.a;
      if (x0 > eps && x0 < maxX - eps) pts.push({x:x0, y:0}); // strictly internal so we don't duplicate corners

      // Intersect with y=maxY => x = (c - b*maxY)/a
      const xMax = (line.c - line.b * maxY) / line.a;
      if (xMax > eps && xMax < maxX - eps) pts.push({x:xMax, y:maxY});
    }
    
    // Fallback if line is completely outside this box, or it's simply parallel
    if (pts.length < 2) {
       // Just graph a big line
       if (Math.abs(line.b) > eps) {
         pts.push({x: -maxX, y: (line.c - line.a * -maxX) / line.b});
         pts.push({x: maxX*2, y: (line.c - line.a * maxX*2) / line.b});
       } else if (Math.abs(line.a) > eps) {
         pts.push({x: line.c / line.a, y: -maxY});
         pts.push({x: line.c / line.a, y: maxY*2});
       }
    }
    
    return pts.slice(0, 2); // strictly a segment
  };

  const plotlyData = [];

  // 1. Plot the filled polygon first
  if (validVertices && validVertices.length > 2) {
    const closedVertices = [...validVertices, validVertices[0]]; // Close the loop
    plotlyData.push({
      x: closedVertices.map(v => v.x),
      y: closedVertices.map(v => v.y),
      fill: 'toself',
      fillcolor: 'rgba(16, 185, 129, 0.4)', // Emerald 500
      line: {
        color: 'rgba(16, 185, 129, 0.8)',
        width: 2
      },
      name: 'Feasible Region',
      hoverinfo: 'x+y+name'
    });
    
    plotlyData.push({
      x: validVertices.map(v => v.x),
      y: validVertices.map(v => v.y),
      mode: 'markers',
      marker: { size: 8, color: '#047857' }, // Emerald 700
      name: 'Vertices',
      hoverinfo: 'x+y'
    });
  }

  // 2. Plot constraint lines
  const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];
  let constraintIdx = 0;
  
  if (lines) {
    lines.forEach((l) => {
      // skip axis boundary plotting since plotly axes render them
      if ((l.a === 1 && l.b === 0 && l.c === 0 && l.type === '>=') ||
          (l.a === 0 && l.b === 1 && l.c === 0 && l.type === '>=')) {
        return;
      }
      
      const pts = getLinePoints(l, maxX, maxY);
      if (pts.length === 2) {
        plotlyData.push({
          x: [pts[0].x, pts[1].x],
          y: [pts[0].y, pts[1].y],
          mode: 'lines',
          line: {
            color: colors[constraintIdx % colors.length],
            width: 2,
            dash: 'dash'
          },
          name: `${l.a}x₁ ${l.b >= 0 ? '+' : '-'} ${Math.abs(l.b)}x₂ ≤ ${l.c}`,
          hoverinfo: 'name'
        });
        constraintIdx++;
      }
    });
  }

  return (
    <div className="card p-6 mt-6 shadow-sm overflow-hidden">
      <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-200">2D Feasible Region & Constraints</h3>
      
      {(!validVertices || validVertices.length === 0) ? (
        <div className="bg-red-50 text-red-600 p-4 rounded text-center">
          The problem is unbounded or infeasible. No enclosed feasible region found.
        </div>
      ) : (
         <div className="w-full h-[500px] flex justify-center bg-gray-50 dark:bg-slate-800/50 rounded-lg">
           <Plot
             data={plotlyData}
             layout={{
               autosize: true,
               margin: { l: 50, r: 20, b: 50, t: 20 },
               paper_bgcolor: 'transparent',
               plot_bgcolor: 'transparent',
               xaxis: { 
                 title: 'x₁', 
                 range: [0, maxX],
                 gridcolor: '#e5e7eb',
                 zerolinecolor: '#9ca3af'
               },
               yaxis: { 
                 title: 'x₂', 
                 range: [0, maxY],
                 gridcolor: '#e5e7eb',
                 zerolinecolor: '#9ca3af'
               },
               showlegend: true,
               legend: { x: 1, xanchor: 'right', y: 1 }
             }}
             useResizeHandler={true}
             style={{ width: '100%', height: '100%' }}
           />
         </div>
      )}
      <p className="text-xs text-center text-gray-500 mt-4">
        The shaded area represents the feasible region satisfying all constraints.
      </p>
    </div>
  );
};

export default FeasibleRegion2D;
