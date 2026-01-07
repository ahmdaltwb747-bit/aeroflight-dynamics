import { Plane, Gauge, Mountain, Zap } from 'lucide-react';
import type { EngineMode, InputValues } from './AircraftAnalyzer';

interface ParameterInputsProps {
  mode: EngineMode;
  inputs: InputValues;
  setInputs: React.Dispatch<React.SetStateAction<InputValues>>;
  onCalculate: () => void;
}

interface InputFieldProps {
  label: string;
  id: keyof InputValues;
  value: number;
  unit?: string;
  step?: string;
  onChange: (id: keyof InputValues, value: number) => void;
}

function InputField({ label, id, value, unit, step = "1", onChange }: InputFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="data-label">{label}</label>
      <div className="relative">
        <input
          type="number"
          id={id}
          value={value}
          step={step}
          onChange={(e) => onChange(id, parseFloat(e.target.value) || 0)}
          className="input-aviation pr-12"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

export function ParameterInputs({ mode, inputs, setInputs, onCalculate }: ParameterInputsProps) {
  const handleChange = (id: keyof InputValues, value: number) => {
    setInputs(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div className="aviation-card space-y-6">
      <div className="flex items-center gap-2">
        <Plane className="w-5 h-5 text-primary" />
        <h2 className="section-title">Aircraft Parameters</h2>
      </div>

      {/* Aircraft Data Section */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Weight (W)"
            id="W"
            value={inputs.W}
            unit="lb"
            onChange={handleChange}
          />
          <InputField
            label="Wing Area (S)"
            id="S"
            value={inputs.S}
            unit="ft²"
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <InputField
            label="Cd0"
            id="Cd0"
            value={inputs.Cd0}
            step="0.001"
            onChange={handleChange}
          />
          <InputField
            label="K"
            id="K"
            value={inputs.K}
            step="0.001"
            onChange={handleChange}
          />
          <InputField
            label="CL max"
            id="CLmax"
            value={inputs.CLmax}
            step="0.01"
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Engine Configuration */}
      <div className="border-t border-border pt-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className={`w-4 h-4 ${mode === 'turbofan' ? 'text-primary' : 'text-turboprop'}`} />
          <h3 className={`text-sm font-bold ${mode === 'turbofan' ? 'text-primary' : 'text-turboprop'}`}>
            {mode === 'turbofan' ? 'Turbofan Configuration' : 'Turboprop Configuration'}
          </h3>
        </div>

        {mode === 'turbofan' ? (
          <div className="space-y-4">
            <div>
              <InputField
                label="Static Thrust (Tv0)"
                id="Tv0"
                value={inputs.Tv0}
                unit="lb"
                onChange={handleChange}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                * Per Engine (×2 internally)
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="n (Index)"
                id="n"
                value={inputs.n}
                step="0.1"
                onChange={handleChange}
              />
              <InputField
                label="Atm. Coeff (A)"
                id="A"
                value={inputs.A}
                step="0.1"
                onChange={handleChange}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Shaft Power (Psh)"
                id="Psh"
                value={inputs.Psh}
                unit="hp"
                onChange={handleChange}
              />
              <InputField
                label="Num Engines"
                id="Ne"
                value={inputs.Ne}
                onChange={handleChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Prop Efficiency (η)"
                id="eta"
                value={inputs.eta}
                step="0.01"
                onChange={handleChange}
              />
              <InputField
                label="Alt. Power Exp (m)"
                id="m"
                value={inputs.m}
                step="0.1"
                onChange={handleChange}
              />
            </div>
          </div>
        )}
      </div>

      {/* Altitude */}
      <div className="border-t border-border pt-5">
        <div className="flex items-center gap-2 mb-3">
          <Mountain className="w-4 h-4 text-info" />
          <h3 className="text-sm font-bold text-info">Flight Altitude</h3>
        </div>
        <InputField
          label="Altitude (h)"
          id="h"
          value={inputs.h}
          unit="ft"
          onChange={handleChange}
        />
      </div>

      {/* Calculate Button */}
      <button
        onClick={onCalculate}
        className={`btn-analyze ${mode === 'turboprop' ? 'btn-turboprop' : ''}`}
      >
        <div className="flex items-center justify-center gap-2">
          <Gauge className="w-5 h-5" />
          <span>Run Analysis</span>
        </div>
      </button>
    </div>
  );
}
