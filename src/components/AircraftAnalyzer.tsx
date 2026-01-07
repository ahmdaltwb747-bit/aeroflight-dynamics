import { useState, useMemo } from 'react';
import { Plane, Settings, Gauge, Wind, TrendingUp, ArrowDown } from 'lucide-react';
import { ParameterInputs } from './ParameterInputs';
import { MetricsCards } from './MetricsCards';
import { PerformanceCharts } from './PerformanceCharts';
import { ResultsPanel } from './ResultsPanel';
import { PerformanceTables } from './PerformanceTables';
import {
  calculateTurbofanPerformance,
  calculateTurbopropPerformance,
  type TurbofanParams,
  type TurbopropParams,
  type PerformanceResults,
} from '@/lib/performanceCalculations';

export type EngineMode = 'turbofan' | 'turboprop';

export interface InputValues {
  // Common
  W: number;
  S: number;
  Cd0: number;
  K: number;
  CLmax: number;
  h: number;
  // Turbofan
  Tv0: number;
  n: number;
  A: number;
  // Turboprop
  Psh: number;
  eta: number;
  Ne: number;
  m: number;
  jetRatio: number;  // Jet Power Ratio
}

const defaultValues: InputValues = {
  W: 8516,
  S: 364,
  Cd0: 0.013,
  K: 0.075,
  CLmax: 1.85,
  h: 7431,
  Tv0: 136,
  n: 0.6,
  A: 0.5,
  Psh: 500,
  eta: 0.85,
  Ne: 2,
  m: 0.6,
  jetRatio: 0.05,
};

export function AircraftAnalyzer() {
  const [mode, setMode] = useState<EngineMode>('turbofan');
  const [inputs, setInputs] = useState<InputValues>(defaultValues);
  const [hasCalculated, setHasCalculated] = useState(false);

  const results = useMemo<PerformanceResults | null>(() => {
    if (!hasCalculated) return null;
    
    if (mode === 'turbofan') {
      const params: TurbofanParams = {
        W: inputs.W,
        S: inputs.S,
        Cd0: inputs.Cd0,
        K: inputs.K,
        CLmax: inputs.CLmax,
        h: inputs.h,
        Tv0: inputs.Tv0,
        n: inputs.n,
        A: inputs.A,
      };
      return calculateTurbofanPerformance(params);
    } else {
      const params: TurbopropParams = {
        W: inputs.W,
        S: inputs.S,
        Cd0: inputs.Cd0,
        K: inputs.K,
        CLmax: inputs.CLmax,
        h: inputs.h,
        Psh: inputs.Psh,
        eta: inputs.eta,
        Ne: inputs.Ne,
        m: inputs.m,
        jetRatio: inputs.jetRatio,
      };
      return calculateTurbopropPerformance(params);
    }
  }, [mode, inputs, hasCalculated]);

  const handleCalculate = () => {
    setHasCalculated(true);
  };

  const handleModeChange = (newMode: EngineMode) => {
    setMode(newMode);
    if (hasCalculated) {
      // Recalculate with new mode
      setHasCalculated(false);
      setTimeout(() => setHasCalculated(true), 0);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="aviation-card">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20 ring-2 ring-primary/30">
                <Plane className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground glow-text">
                  Aircraft Performance Analyzer
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Advanced Aerodynamics & Flight Mechanics Tool
                </p>
              </div>
            </div>
            <div className="text-left lg:text-right bg-muted/50 px-5 py-3 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Designed & Developed By
              </p>
              <p className="text-sm font-bold text-primary mt-0.5">
                AV ENG Ahmed Abdulrahman Ali Al-Sharshimi
              </p>
            </div>
          </div>
        </header>

        {/* Mode Selector */}
        <div className="flex justify-center">
          <div className="aviation-card p-1.5 inline-flex gap-1">
            <button
              onClick={() => handleModeChange('turbofan')}
              className={`mode-button ${
                mode === 'turbofan' 
                  ? 'mode-button-active' 
                  : 'mode-button-inactive'
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span>Turbofan / Jet</span>
              </div>
            </button>
            <button
              onClick={() => handleModeChange('turboprop')}
              className={`mode-button ${
                mode === 'turboprop' 
                  ? 'mode-button-turboprop-active text-foreground' 
                  : 'mode-button-inactive'
              }`}
            >
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4" />
                <span>Turboprop</span>
              </div>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Panel - Inputs */}
          <div className="lg:col-span-4 space-y-6">
            <ParameterInputs
              mode={mode}
              inputs={inputs}
              setInputs={setInputs}
              onCalculate={handleCalculate}
            />
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-8 space-y-6">
            {results ? (
              <>
                <MetricsCards results={results} mode={mode} />
                <PerformanceCharts results={results} mode={mode} />
                <PerformanceTables results={results} mode={mode} />
                <ResultsPanel results={results} mode={mode} />
              </>
            ) : (
              <div className="aviation-card flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="p-4 rounded-full bg-muted/50 mb-4">
                  <Gauge className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Ready for Analysis
                </h3>
                <p className="text-muted-foreground max-w-md">
                  Enter your aircraft parameters and click "Run Analysis" to calculate performance metrics, 
                  generate charts, and view detailed results.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground pt-8 border-t border-border">
          <p>© 2025 Aircraft Performance Analyzer. All algorithms based on Standard Atmosphere & Aerodynamic Theory.</p>
          <p className="mt-1 font-semibold text-primary">
            Developed by AV ENG Ahmed Abdulrahman Ali Al-Sharshimi
          </p>
        </footer>
      </div>
    </div>
  );
}
