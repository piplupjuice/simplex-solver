# Simplex Method Solver

A production-ready, interactive web application to solve Linear Programming Problems step by step using the Simplex Method. Built for MAT316 Operations Research.
link : https://simplex-solver-ten.vercel.app/

![Simplex Solver Demo](demo.gif)

## Features
- **Step-by-step Execution**: Understand the Simplex algorithm with plain English narration for each step
- **Exact Mathematics**: Uses fractional arithmetic instead of floating-point decimals
- **Visual Learning**: Pivot rows, columns, and cells are highlighted according to class notation
- **2D & 3D Plotting**: Visualize the feasible region polygons for 2-variable problems and solid polyhedrons for 3-variable problems using Plotly
- **Interactive Controls**: Navigate backwards and forwards through tableaus
- **Modern UI**: Full Dark/Light mode support, mobile responsive, and smooth animated transitions
- **Shareable**: Problem configurations are serialized to the URL so you can share specific homework questions easily
- **Built-in Examples**: Load predefined example problems to explore how the solver works

## Tech Stack
- React 18 + Vite
- Tailwind CSS
- Framer Motion
- Plotly.js (via react-plotly.js)
- fraction.js

## Run Locally
1. Clone this repository
2. Run `npm install`
3. Run `npm run dev`
4. Open the displayed localhost URL in your browser

## Class Notation Adherence
This solver faithfully implements the classroom standard:
- Chooses the most negative $Z$-row coefficient (for Minimization, or internally-minimizing Maximization)
- Highlights the intersection of the departing basic variable and entering variable
- Generates precise steps without floating-point errors

---
*Built as a portfolio project and MAT316 Eid Bonus Assignment.*
