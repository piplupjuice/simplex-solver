import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const FeasibleRegion2D = ({ constraints }) => {
  if (!constraints || constraints.length === 0) return null;

  if (constraints[0].coeffs.length !== 2) {
    return (
      <div className="card p-6 mt-6 shadow-sm border-dashed border-gray-300 dark:border-slate-600 bg-gray-50/50 dark:bg-slate-800/50 text-center">
        <h3 className="font-bold text-lg mb-2 text-gray-600 dark:text-gray-400">Graphical View Unavailable</h3>
        <p className="text-sm text-gray-500">
          The feasible region graph is only available for 2-dimensional boundaries (2 variables). 
          Visualizing {constraints[0].coeffs.length}D intersections requires complex 3D plotting outside the scope of this view.
        </p>
      </div>
    );
  }

  // Generate data points for lines
  // constraint: a*x + b*y <= c  => y = (c - a*x) / b
  const data = [];
  const maxX = 20; // heuristic scale
  
  for (let x = 0; x <= maxX; x++) {
    const point = { x };
    constraints.forEach((c, i) => {
      const a = c.coeffs[0];
      const b = c.coeffs[1];
      const rhs = c.rhs;
      if (b !== 0) {
        point[`Line ${i + 1}`] = (rhs - a * x) / b;
      }
    });
    data.push(point);
  }

  // Find colors
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="card p-6 mt-6 shadow-sm">
      <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-200">2D Feasible Region Preview</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="x" type="number" domain={[0, 'dataMax']} />
            <YAxis />
            <Tooltip />
            <ReferenceLine y={0} stroke="#000" />
            <ReferenceLine x={0} stroke="#000" />
            {constraints.map((c, i) => (
              c.coeffs[1] !== 0 && (
                <Line 
                  key={i}
                  type="linear"
                  dataKey={`Line ${i + 1}`}
                  stroke={colors[i % colors.length]}
                  dot={false}
                  strokeWidth={2}
                />
              )
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-center text-gray-500 mt-2">
        Note: The actual feasible region is below/above these lines based on inequality direction and non-negativity.
      </p>
    </div>
  );
};

export default FeasibleRegion2D;
