import type { EngineMode, InputValues } from '@/components/AircraftAnalyzer';
import { toDisplay, unitOf, type UnitSystem } from './units';

export interface ValidationError {
  field: keyof InputValues | 'cross';
  message: string;
}

/**
 * Friendly, physically-grounded validation.
 * Bounds are checked in internal Imperial units; the messages show numbers
 * converted to the user's current unit system.
 */
export function validateInputs(
  mode: EngineMode,
  v: InputValues,
  sys: UnitSystem = 'imperial',
): ValidationError[] {
  const errors: ValidationError[] = [];

  const push = (field: ValidationError['field'], cond: boolean, message: string) => {
    if (cond) errors.push({ field, message });
  };
  const u = (cat: Parameters<typeof unitOf>[0]) => unitOf(cat, sys);
  const d = (x: number, cat: Parameters<typeof unitOf>[0]): number =>
    Number(toDisplay(x, cat, sys).toPrecision(5));

  // Common aircraft data
  push('W', !(v.W > 0), `Gross weight (W) must be greater than 0 ${u('weight')}.`);
  push('W', v.W > 3_000_000, `Gross weight (W) looks unrealistically high (max ${d(3_000_000, 'weight')} ${u('weight')}).`);
  push('S', !(v.S > 0), `Wing area (S) must be greater than 0 ${u('area')}.`);
  push('S', v.S > 20_000, `Wing area (S) looks unrealistically high (max ${d(20_000, 'area')} ${u('area')}).`);
  push('Cd0', !(v.Cd0 > 0), 'Zero-lift drag coefficient (Cd0) must be greater than 0.');
  push('Cd0', v.Cd0 >= 0.5, 'Cd0 is too large — typical aircraft values are 0.01–0.05.');
  push('K', !(v.K > 0), 'Induced drag factor (K) must be greater than 0.');
  push('K', v.K >= 1, 'K is too large — typical values are 0.03–0.08.');
  push('CLmax', !(v.CLmax > 0), 'Maximum lift coefficient (CL max) must be greater than 0.');
  push('CLmax', v.CLmax > 8, 'CL max looks too high — typical values are 1.2–3.0.');
  push('h', v.h < 0, 'Altitude (h) cannot be negative.');
  push('h', v.h > 65_000, 'Altitude (h) is above the model limit (~20 km — ISA stratosphere).');

  // Range & endurance (common)
  push('W0', !(v.W0 > 0), `Initial weight (W₀) must be greater than 0 ${u('weight')} to compute range & endurance.`);
  push('Wf', v.Wf < 0, 'Fuel weight (Wf) cannot be negative.');
  push('cross', v.W0 > 0 && v.Wf > 0 && v.Wf >= v.W0, 'Fuel weight (Wf) must be smaller than the initial weight (W₀).');

  if (mode === 'turbofan') {
    push('Tv0', !(v.Tv0 > 0), `Static thrust (Tv0) must be greater than 0 ${u('thrust')}.`);
    push('n', !(v.n > 0), 'Thrust decay exponent (n) must be greater than 0.');
    push('n', v.n >= 2, 'Thrust decay exponent (n) is too large — typical value is 0.5–0.8.');
    push('A', !(v.A > 0), 'Atmospheric coefficient (A) must be greater than 0.');
    push('A', v.A > 2, 'Atmospheric coefficient (A) looks too large — typical value is 0.5.');
    push('m', !(v.m > 0), 'Altitude power exponent (m) must be greater than 0.');
    push('m', v.m >= 2, 'Altitude power exponent (m) is too large — typical value is 0.6.');
    push('Ct', !(v.Ct > 0), `TSFC (Ct) must be greater than 0 for range & endurance.`);
    push('Ct', v.Ct > 5, `TSFC (Ct) looks too high — typical turbofan values are ${d(0.5, 'tsfc')}–${d(0.9, 'tsfc')} ${u('tsfc')}.`);
  } else if (mode === 'turboprop') {
    push('Psh', !(v.Psh > 0), `Shaft power (Psh) must be greater than 0 ${u('power')}.`);
    push('Ne', !(v.Ne >= 1), 'Number of engines must be at least 1.');
    push('Ne', !Number.isInteger(v.Ne), 'Number of engines must be a whole number.');
    push('eta', !(v.eta > 0), 'Propeller efficiency (η) must be greater than 0.');
    push('eta', v.eta > 1, 'Propeller efficiency (η) cannot exceed 1.');
    push('jetRatio', v.jetRatio < 0, 'Jet power ratio cannot be negative.');
    push('jetRatio', v.jetRatio > 1, 'Jet power ratio looks too large (max 1).');
    push('m', !(v.m > 0), 'Altitude power exponent (m) must be greater than 0.');
    push('m', v.m >= 2, 'Altitude power exponent (m) is too large — typical value is 0.6–0.8.');
    push('c', !(v.c > 0), 'PSFC (c) must be greater than 0 for range & endurance.');
    push('c', v.c > 5, `PSFC (c) looks too high — typical turboprop values are ${d(0.4, 'psfc')}–${d(0.7, 'psfc')} ${u('psfc')}.`);
  } else {
    push('P0', !(v.P0 > 0), `Maximum shaft power (P₀) must be greater than 0 ${u('power')}.`);
    push('eta', !(v.eta > 0), 'Propeller efficiency (η) must be greater than 0.');
    push('eta', v.eta > 1, 'Propeller efficiency (η) cannot exceed 1.');
    push('c', !(v.c > 0), 'PSFC (c) must be greater than 0 for range & endurance.');
    push('c', v.c > 5, `PSFC (c) looks too high — typical piston values are ${d(0.4, 'psfc')}–${d(0.5, 'psfc')} ${u('psfc')}.`);
  }

  return errors;
}
