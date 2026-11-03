import { Plane, Gauge, Mountain, Zap, Loader2, Info, RotateCcw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toDisplay, fromDisplay, unitOf, cleanInput, type UnitCategory, type UnitSystem } from '@/lib/units';
import { PRESETS } from '@/lib/presets';
import type { ValidationError } from '@/lib/validation';
import type { EngineMode, InputValues } from './AircraftAnalyzer';

interface ParameterInputsProps {
  mode: EngineMode;
  inputs: InputValues;
  setInputs: React.Dispatch<React.SetStateAction<InputValues>>;
  onCalculate: () => void;
  isCalculating?: boolean;
  sys: UnitSystem;
  errors: ValidationError[];
  showErrors: boolean;
  onReset: () => void;
  onPreset: (presetId: string) => void;
}

interface InputFieldProps {
  label: string;
  id: keyof InputValues;
  value: number;
  /** Unit category — 'none' means dimensionless. */
  cat?: UnitCategory;
  step?: string;
  tip?: string;
  sys: UnitSystem;
  error?: string;
  onChange: (id: keyof InputValues, value: number) => void;
}

function InputField({
  label,
  id,
  value,
  cat = 'none',
  step = "1",
  tip,
  sys,
  error,
  onChange
}: InputFieldProps) {
  const unit = unitOf(cat, sys);
  const display = cat === 'none' ? value : cleanInput(toDisplay(value, cat, sys));

  const handleChange = (raw: string) => {
    const num = parseFloat(raw);
    if (isNaN(num)) {
      onChange(id, 0);
      return;
    }
    onChange(id, cat === 'none' ? num : fromDisplay(num, cat, sys));
  };

  return (
    <div>
      <label htmlFor={id} className="data-label flex items-center justify-between gap-1 cursor-help">
        <span className="flex items-center gap-1">
          {label}
          {tip && (
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <Info className="w-3 h-3 text-muted-foreground/70 hover:text-primary transition-colors shrink-0" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px] text-xs">
                {tip}
              </TooltipContent>
            </Tooltip>
          )}
        </span>
        {unit && <span className="text-[10px] font-medium normal-case text-muted-foreground/80">{unit}</span>}
      </label>
      <div className="relative">
        <input
          type="number"
          id={id}
          value={display}
          step={step}
          onChange={e => handleChange(e.target.value)}
          className={`input-aviation-sm ${error ? 'input-error' : ''}`}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {unit}
          </span>
        )}
      </div>
      {error && <p className="text-[11px] text-destructive mt-1 leading-snug">{error}</p>}
    </div>
  );
}

export function ParameterInputs({
  mode,
  inputs,
  setInputs,
  onCalculate,
  isCalculating = false,
  sys,
  errors,
  showErrors,
  onReset,
  onPreset,
}: ParameterInputsProps) {
  const handleChange = (id: keyof InputValues, value: number) => {
    setInputs(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const errorFor = (id: keyof InputValues): string | undefined =>
    showErrors ? errors.find(e => e.field === id)?.message : undefined;
  const crossError = showErrors ? errors.find(e => e.field === 'cross')?.message : undefined;

  const getModeColor = () => {
    if (mode === 'turboprop') return 'text-turboprop';
    if (mode === 'piston') return 'text-warning';
    return 'text-primary';
  };

  const getModeLabel = () => {
    if (mode === 'turboprop') return 'Turboprop Configuration';
    if (mode === 'piston') return 'Piston Engine Configuration';
    return 'Turbofan Configuration';
  };

  const tips: Record<string, string> = {
    W: 'Gross weight of the aircraft at the analysis condition.',
    S: 'Wing reference area used for lift and drag coefficients.',
    Cd0: 'Zero-lift (parasite) drag coefficient of the clean configuration.',
    K: 'Induced drag factor K = 1 / (π · e · AR).',
    CLmax: 'Maximum lift coefficient — sets the stall speed.',
    h: 'Flight altitude above sea level.',
    Tv0: 'Sea-level static thrust per engine. The app doubles it internally (2 engines).',
    n: 'Thrust lapse exponent for the turbofan altitude model.',
    A: 'Atmospheric coefficient used in the turbofan thrust model.',
    m: 'Altitude power exponent — how fast power/thrust decays with altitude.',
    Psh: 'Total shaft power per engine at sea level.',
    Ne: 'Number of engines driving the propeller.',
    eta: 'Propeller efficiency (0–1).',
    jetRatio: 'Jet power ratio added to propeller efficiency for turboprops.',
    P0: 'Maximum shaft power of the piston engine at sea level.',
    W0: 'Initial gross weight for range & endurance (Breguet).',
    Wf: 'Fuel weight burned during the cruise segment.',
    Ct: 'Thrust-specific fuel consumption (TSFC) for turbofan cruise.',
    c: 'Power-specific fuel consumption (PSFC) for prop engines.',
  };

  return (
    <div className="aviation-card space-y-6">
      <div className="flex items-center gap-2">
        <Plane className="w-5 h-5 text-primary" />
        <h2 className="section-title">Aircraft Parameters</h2>
      </div>

      {/* Presets */}
      <div>
        <label htmlFor="preset" className="data-label">Preset Aircraft</label>
        <select
          id="preset"
          value=""
          onChange={e => {
            if (e.target.value) onPreset(e.target.value);
            e.target.value = '';
          }}
          className="select-aviation"
        >
          <option value="" disabled>Load a preset aircraft…</option>
          {PRESETS.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.description}
            </option>
          ))}
        </select>
        <p className="text-[10px] text-muted-foreground mt-1">
          Fills all parameters with typical published values — refine as needed.
        </p>
      </div>

      {/* Aircraft Data Section */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Weight (W)" id="W" value={inputs.W} cat="weight" tip={tips.W} sys={sys} error={errorFor('W')} onChange={handleChange} />
          <InputField label="Wing Area (S)" id="S" value={inputs.S} cat="area" tip={tips.S} sys={sys} error={errorFor('S')} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <InputField label="Cd0" id="Cd0" value={inputs.Cd0} step="0.001" tip={tips.Cd0} sys={sys} error={errorFor('Cd0')} onChange={handleChange} />
          <InputField label="K" id="K" value={inputs.K} step="0.001" tip={tips.K} sys={sys} error={errorFor('K')} onChange={handleChange} />
          <InputField label="CL max" id="CLmax" value={inputs.CLmax} step="0.01" tip={tips.CLmax} sys={sys} error={errorFor('CLmax')} onChange={handleChange} />
        </div>
      </div>

      {/* Engine Configuration */}
      <div className="border-t border-border pt-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className={`w-4 h-4 ${getModeColor()}`} />
          <h3 className={`text-sm font-bold ${getModeColor()}`}>
            {getModeLabel()}
          </h3>
        </div>

        {mode === 'turbofan' ? (
          <div className="space-y-4">
            <div>
              <InputField label="Static Thrust (Tv0)" id="Tv0" value={inputs.Tv0} cat="thrust" tip={tips.Tv0} sys={sys} error={errorFor('Tv0')} onChange={handleChange} />
              <p className="text-[10px] text-muted-foreground mt-1">
                * Per Engine (×2 internally)
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <InputField label="n (Index)" id="n" value={inputs.n} step="0.1" tip={tips.n} sys={sys} error={errorFor('n')} onChange={handleChange} />
              <InputField label="Atm. Coeff (A)" id="A" value={inputs.A} step="0.1" tip={tips.A} sys={sys} error={errorFor('A')} onChange={handleChange} />
              <InputField label="Alt. Power Exp (m)" id="m" value={inputs.m} step="0.1" tip={tips.m} sys={sys} error={errorFor('m')} onChange={handleChange} />
            </div>
          </div>
        ) : mode === 'turboprop' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputField label="Shaft Power (Psh)" id="Psh" value={inputs.Psh} cat="power" tip={tips.Psh} sys={sys} error={errorFor('Psh')} onChange={handleChange} />
              <InputField label="Num Engines" id="Ne" value={inputs.Ne} tip={tips.Ne} sys={sys} error={errorFor('Ne')} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputField label="Prop Efficiency (η)" id="eta" value={inputs.eta} step="0.01" tip={tips.eta} sys={sys} error={errorFor('eta')} onChange={handleChange} />
              <InputField label="Jet Power Ratio" id="jetRatio" value={inputs.jetRatio} step="0.01" tip={tips.jetRatio} sys={sys} error={errorFor('jetRatio')} onChange={handleChange} />
            </div>
            <InputField label="Alt. Power Exp (m)" id="m" value={inputs.m} step="0.1" tip={tips.m} sys={sys} error={errorFor('m')} onChange={handleChange} />
          </div>
        ) : (
          <div className="space-y-4">
            <InputField label="Max Shaft Power (P₀)" id="P0" value={inputs.P0} cat="power" tip={tips.P0} sys={sys} error={errorFor('P0')} onChange={handleChange} />
            <InputField label="Prop Efficiency (η)" id="eta" value={inputs.eta} step="0.01" tip={tips.eta} sys={sys} error={errorFor('eta')} onChange={handleChange} />
            <p className="text-[10px] text-muted-foreground mt-1">
              * Power decays with altitude as P = P₀ · σ
            </p>
          </div>
        )}
      </div>

      {/* Range & Endurance */}
      <div className="border-t border-border pt-5">
        <div className="flex items-center gap-2 mb-3">
          <Gauge className="w-4 h-4 text-success" />
          <h3 className="text-sm font-bold text-success">Range &amp; Endurance</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InputField label="Initial Weight (W₀)" id="W0" value={inputs.W0} cat="weight" tip={tips.W0} sys={sys} error={errorFor('W0')} onChange={handleChange} />
          <InputField label="Fuel Weight (Wf)" id="Wf" value={inputs.Wf} cat="weight" tip={tips.Wf} sys={sys} error={errorFor('Wf')} onChange={handleChange} />
        </div>
        {crossError && <p className="text-[11px] text-destructive mt-1 leading-snug">{crossError}</p>}
        {mode === 'turbofan' ? (
          <div className="mt-3">
            <InputField label="TSFC (Ct)" id="Ct" value={inputs.Ct} cat="tsfc" step="0.01" tip={tips.Ct} sys={sys} error={errorFor('Ct')} onChange={handleChange} />
          </div>
        ) : (
          <div className="mt-3">
            <InputField label="PSFC (c)" id="c" value={inputs.c} cat="psfc" step="0.01" tip={tips.c} sys={sys} error={errorFor('c')} onChange={handleChange} />
          </div>
        )}
      </div>

      {/* Altitude */}
      <div className="border-t border-border pt-5">
        <div className="flex items-center gap-2 mb-3">
          <Mountain className="w-4 h-4 text-info" />
          <h3 className="text-sm font-bold text-info">Flight Altitude</h3>
        </div>
        <InputField label="Altitude (h)" id="h" value={inputs.h} cat="altitude" tip={tips.h} sys={sys} error={errorFor('h')} onChange={handleChange} />
      </div>

      {/* Buttons */}
      <div className="space-y-2">
        <button
          onClick={onCalculate}
          disabled={isCalculating}
          className={`btn-analyze ${mode === 'turboprop' ? 'btn-turboprop' : mode === 'piston' ? 'btn-piston' : ''} ${isCalculating ? 'animate-pulse' : ''}`}
        >
          <div className="flex items-center justify-center gap-2">
            {isCalculating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Gauge className="w-5 h-5" />
            )}
            <span>{isCalculating ? 'Calculating...' : 'Run Analysis'}</span>
          </div>
        </button>
        <button onClick={onReset} disabled={isCalculating} className="btn-reset">
          <div className="flex items-center justify-center gap-2">
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </div>
        </button>
      </div>
    </div>
  );
}
