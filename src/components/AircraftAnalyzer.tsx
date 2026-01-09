import { useState, useMemo } from 'react';
import { Plane, Settings, Wind, Cog } from 'lucide-react';
import { ParameterInputs } from './ParameterInputs';
import { MetricsCards } from './MetricsCards';
import { PerformanceCharts } from './PerformanceCharts';
import { ResultsPanel } from './ResultsPanel';
import { PerformanceTables } from './PerformanceTables';
import {
  calculateTurbofanPerformance,
  calculateTurbopropPerformance,
  calculatePistonPerformance,
  type TurbofanParams,
  type TurbopropParams,
  type PistonParams,
  type PerformanceResults,
} from '@/lib/performanceCalculations';
import logo from '@/assets/logo.jpeg';

export type EngineMode = 'turbofan' | 'turboprop' | 'piston';

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
  jetRatio: number;
  // Piston
  P0: number;
  // Range & Endurance
  W0: number;
  Wf: number;
  Ct: number;
  c: number;
}

// All values start at 0
const defaultValues: InputValues = {
  W: 0,
  S: 0,
  Cd0: 0,
  K: 0,
  CLmax: 0,
  h: 0,
  Tv0: 0,
  n: 0,
  A: 0,
  Psh: 0,
  eta: 0,
  Ne: 0,
  m: 0,
  jetRatio: 0,
  P0: 0,
  W0: 0,
  Wf: 0,
  Ct: 0,
  c: 0,
};

export function AircraftAnalyzer() {
  const [mode, setMode] = useState<EngineMode>('turbofan');
  const [inputs, setInputs] = useState<InputValues>(defaultValues);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

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
        m: inputs.m,
        W0: inputs.W0,
        Wf: inputs.Wf,
        Ct: inputs.Ct,
      };
      return calculateTurbofanPerformance(params);
    } else if (mode === 'turboprop') {
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
        W0: inputs.W0,
        Wf: inputs.Wf,
        c: inputs.c,
      };
      return calculateTurbopropPerformance(params);
    } else {
      const params: PistonParams = {
        W: inputs.W,
        S: inputs.S,
        Cd0: inputs.Cd0,
        K: inputs.K,
        CLmax: inputs.CLmax,
        h: inputs.h,
        P0: inputs.P0,
        eta: inputs.eta,
        W0: inputs.W0,
        Wf: inputs.Wf,
        c: inputs.c,
      };
      return calculatePistonPerformance(params);
    }
  }, [mode, inputs, hasCalculated]);

  const handleCalculate = () => {
    setIsCalculating(true);
    // Simulate calculation time for animation
    setTimeout(() => {
      setHasCalculated(true);
      setIsCalculating(false);
    }, 800);
  };

  const handleModeChange = (newMode: EngineMode) => {
    setMode(newMode);
    if (hasCalculated) {
      setHasCalculated(false);
      setTimeout(() => setHasCalculated(true), 0);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <header className="aviation-card">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden ring-2 ring-primary/30 shadow-lg">
                <img src={logo} alt="Performance Analytics Logo" className="w-full h-full object-cover" />
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
            <button
              onClick={() => handleModeChange('piston')}
              className={`mode-button ${
                mode === 'piston' 
                  ? 'mode-button-piston-active text-foreground' 
                  : 'mode-button-inactive'
              }`}
            >
              <div className="flex items-center gap-2">
                <Cog className="w-4 h-4" />
                <span>Piston</span>
              </div>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Panel - Inputs */}
          <div className="lg:col-span-3 space-y-6">
            <ParameterInputs
              mode={mode}
              inputs={inputs}
              setInputs={setInputs}
              onCalculate={handleCalculate}
              isCalculating={isCalculating}
            />
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-9 space-y-6">
            {results ? (
              <>
                <MetricsCards results={results} mode={mode} />
                <PerformanceCharts results={results} mode={mode} />
                <PerformanceTables results={results} mode={mode} />
                <ResultsPanel results={results} mode={mode} />
              </>
            ) : (
              <div className="aviation-card flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className={`p-4 rounded-full bg-muted/50 mb-4 ${isCalculating ? 'animate-pulse' : ''}`}>
                  <Plane className={`w-12 h-12 text-muted-foreground ${isCalculating ? 'animate-spin' : ''}`} />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {isCalculating ? 'Calculating...' : 'Ready for Analysis'}
                </h3>
                <p className="text-muted-foreground max-w-md">
                  {isCalculating 
                    ? 'Processing aircraft performance calculations...'
                    : 'Enter your aircraft parameters and click "Run Analysis" to calculate performance metrics, generate charts, and view detailed results.'}
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
