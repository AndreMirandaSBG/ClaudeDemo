import { useState } from 'react';
import { Calculator } from './components/Calculator';
import { FunctionGrapher } from './components/FunctionGrapher';
import { Statistics } from './components/Statistics';
import { ComplexCalculator } from './components/ComplexCalculator';
import { SurfacePlotter } from './components/SurfacePlotter';
import { EquationSolver } from './components/EquationSolver';
import { UnitConverter } from './components/UnitConverter';
import { CalculusVisualizer } from './components/CalculusVisualizer';
import { MatrixWorkspace } from './components/MatrixWorkspace';
import { DiffEqSolver } from './components/DiffEqSolver';
import { FourierAnalysis } from './components/FourierAnalysis';
import { DistributionExplorer } from './components/DistributionExplorer';
import { NumberTheory } from './components/NumberTheory';
import { TensorCalc } from './components/TensorCalc';
import { GeometryExplorer } from './components/GeometryExplorer';
import { MLDashboard } from './components/MLDashboard';
import { GraphTheory } from './components/GraphTheory';
import { QuantumCircuit } from './components/QuantumCircuit';
import { TimeSeriesAnalysis } from './components/TimeSeriesAnalysis';
import { ChaosExplorer } from './components/ChaosExplorer';
import './index.css';

type Tab =
  | 'calculator' | 'grapher' | 'statistics' | 'complex'
  | 'surface' | 'solver' | 'converter'
  | 'calculus' | 'matrix' | 'diffeq'
  | 'fourier' | 'distribution' | 'numbertheory'
  | 'tensor' | 'geometry' | 'ml'
  | 'graphtheory' | 'quantum' | 'timeseries'
  | 'chaos';

const TABS: { id: Tab; label: string }[] = [
  { id: 'calculator', label: 'Calculator' },
  { id: 'grapher', label: 'Graph' },
  { id: 'statistics', label: 'Statistics' },
  { id: 'complex', label: 'Complex' },
  { id: 'surface', label: '3D Surface' },
  { id: 'solver', label: 'Solver' },
  { id: 'converter', label: 'Converter' },
  { id: 'calculus', label: 'Calculus' },
  { id: 'matrix', label: 'Matrix' },
  { id: 'diffeq', label: 'Diff Eq' },
  { id: 'fourier', label: 'Fourier' },
  { id: 'distribution', label: 'Distributions' },
  { id: 'numbertheory', label: 'Number Theory' },
  { id: 'tensor', label: 'Tensor Calc' },
  { id: 'geometry', label: 'Geometry' },
  { id: 'ml', label: 'ML Dashboard' },
  { id: 'graphtheory', label: 'Graph Theory' },
  { id: 'quantum', label: 'Quantum' },
  { id: 'timeseries', label: 'Time Series' },
  { id: 'chaos', label: 'Chaos Theory' },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('calculator');

  return (
    <div className="app">
      <nav className="tab-nav">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            className={`tab-nav__btn ${activeTab === id ? 'tab-nav__btn--active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="tab-content">
        {activeTab === 'calculator' && <Calculator />}
        {activeTab === 'grapher' && <FunctionGrapher />}
        {activeTab === 'statistics' && <Statistics />}
        {activeTab === 'complex' && <ComplexCalculator />}
        {activeTab === 'surface' && <SurfacePlotter />}
        {activeTab === 'solver' && <EquationSolver />}
        {activeTab === 'converter' && <UnitConverter />}
        {activeTab === 'calculus' && <CalculusVisualizer />}
        {activeTab === 'matrix' && <MatrixWorkspace />}
        {activeTab === 'diffeq' && <DiffEqSolver />}
        {activeTab === 'fourier' && <FourierAnalysis />}
        {activeTab === 'distribution' && <DistributionExplorer />}
        {activeTab === 'numbertheory' && <NumberTheory />}
        {activeTab === 'tensor' && <TensorCalc />}
        {activeTab === 'geometry' && <GeometryExplorer />}
        {activeTab === 'ml' && <MLDashboard />}
        {activeTab === 'graphtheory' && <GraphTheory />}
        {activeTab === 'quantum' && <QuantumCircuit />}
        {activeTab === 'timeseries' && <TimeSeriesAnalysis />}
        {activeTab === 'chaos' && <ChaosExplorer />}
      </div>
    </div>
  );
}

export default App;
