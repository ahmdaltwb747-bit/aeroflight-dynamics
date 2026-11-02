import { useState, useMemo, useEffect } from 'react';
import { Plane, Settings, Wind, Cog, BookOpen } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { ParameterInputs } from './ParameterInputs';
import { MetricsCards } from './MetricsCards';
import { PerformanceCharts } from './PerformanceCharts';
import { ResultsPanel } from './ResultsPanel';
import { PerformanceTables } from './PerformanceTables';
import { ExportButtons } from './ExportButtons';
import { ThemeToggle } from './ThemeToggle';
import { UnitToggle } from './UnitToggle';
import { PRESETS } from '@/lib/presets';
import { validateInputs, type ValidationError } from '@/lib/validation';
import type { UnitSystem } from '@/lib/units';
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

// All values start at 0 (stored internally in Imperial units)
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
  const [showErrors, setShowErrors] = useState(false);
  const [sys, setSys] = useState<UnitSystem>(() => {
    try {
      return localStorage.getItem('app-units') === 'metric' ? 'metric' : 'imperial';
    } catch {
      return 'imperial';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('app-units', sys);
    } catch {
      /* ignore */
    }
  }, [sys]);

  const errors = useMemo<ValidationError[]>(
    () => validateInputs(mode, inputs, sys),
    [mode, inputs, sys],
  );

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
    if (errors.length > 0) {
      setShowErrors(true);
      setHasCalculated(false);
      return;
    }
    setShowErrors(false);
    setIsCalculating(true);
    // Simulate calculation time for animation
    setTimeout(() => {
      setHasCalculated(true);
      setIsCalculating(false);
    }, 800);
  };

  const handleModeChange = (newMode: EngineMode) => {
    setMode(newMode);
    setShowErrors(false);
    if (hasCalculated) {
      if (validateInputs(newMode, inputs, sys).length === 0) {
        setHasCalculated(false);
        setTimeout(() => setHasCalculated(true), 0);
      } else {
        setHasCalculated(false);
      }
    }
  };

  const handlePreset = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setMode(preset.mode);
    setInputs({ ...defaultValues, ...preset.values });
    setHasCalculated(false);
    setShowErrors(false);
  };

  const handleReset = () => {
    setInputs(defaultValues);
    setHasCalculated(false);
    setShowErrors(false);
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <header className="aviation-card animate-fade-in">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden ring-2 ring-primary/30 shadow-lg shrink-0">
                <img src={logo} alt="Aircraft Performance Analyzer logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground glow-text">
                  Aircraft Performance Analyzer
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Turbofan · Turboprop · Piston — aerodynamics &amp; flight mechanics made simple
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap self-end lg:self-auto">
              <NavLink
                to="/methodology"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" /> Methodology
              </NavLink>
              <UnitToggle sys={sys} onChange={setSys} />
              <div className="text-left lg:text-right bg-muted/50 px-5 py-3 rounded-lg border border-border">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Designed &amp; Developed By
                </p>
                <p className="text-sm font-bold text-primary mt-0.5">
                  Ahmed Abdulrahman Ali
                </p>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Mode Selector */}
        <div className="flex justify-center">
          <div className="aviation-card p-1.5 inline-flex gap-1 flex-wrap justify-center max-w-full">
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
              sys={sys}
              errors={errors}
              showErrors={showErrors}
              onReset={handleReset}
              onPreset={handlePreset}
            />
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-9 space-y-6">
            {results ? (
              <>
                <MetricsCards results={results} mode={mode} sys={sys} />
                <PerformanceCharts results={results} mode={mode} sys={sys} />
                <PerformanceTables results={results} mode={mode} sys={sys} />
                <ResultsPanel results={results} mode={mode} sys={sys} />
                <ExportButtons results={results} mode={mode} inputs={inputs} sys={sys} />
              </>
            ) : (
              <div className="aviation-card flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className={`p-4 rounded-full bg-muted/50 mb-4 ${isCalculating ? 'animate-pulse' : ''}`}>
                  <Plane className={`w-12 h-12 text-muted-foreground ${isCalculating ? 'animate-spin' : ''}`} />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {isCalculating ? 'Calculating...' : showErrors && errors.length > 0 ? 'Check Your Inputs' : 'Ready for Analysis'}
                </h3>
                <p className="text-muted-foreground max-w-md">
                  {isCalculating
                    ? 'Processing aircraft performance calculations...'
                    : showErrors && errors.length > 0
                    ? 'Please fix the highlighted fields on the left, then run the analysis again.'
                    : 'Enter your aircraft parameters and click "Run Analysis" to calculate performance metrics, generate charts, and view detailed results.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground pt-8 border-t border-border space-y-1">
          <p>© {new Date().getFullYear()} Aircraft Performance Analyzer · v1.0.0</p>
          <p className="text-xs">For educational purposes only — verify all results before operational use.</p>
          <p className="font-semibold text-primary">
            Developed by Ahmed Abdulrahman Ali
          </p>
        </footer>
      </div>
    </div>
  );
}
