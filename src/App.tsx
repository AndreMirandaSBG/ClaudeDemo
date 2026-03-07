import { useState } from 'react';
import { Calculator } from './components/Calculator';
import { FunctionGrapher } from './components/FunctionGrapher';
import { Statistics } from './components/Statistics';
import { ComplexCalculator } from './components/ComplexCalculator';
import './index.css';

type Tab = 'calculator' | 'grapher' | 'statistics' | 'complex';

const TABS: { id: Tab; label: string }[] = [
  { id: 'calculator', label: 'Calculator' },
  { id: 'grapher', label: 'Graph' },
  { id: 'statistics', label: 'Statistics' },
  { id: 'complex', label: 'Complex' },
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
      </div>
    </div>
  );
}

export default App;
