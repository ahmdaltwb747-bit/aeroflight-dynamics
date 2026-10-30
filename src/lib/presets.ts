import type { InputValues } from './AircraftAnalyzer';

export interface AircraftPreset {
  id: string;
  name: string;
  description: string;
  /** Relevant engine mode — selecting the preset switches to this mode. */
  mode: 'turbofan' | 'turboprop' | 'piston';
  /** Values in internal Imperial units. */
  values: Partial<InputValues>;
}

/**
 * Typical published/approximate parameters (values the user can refine).
 * A350-1000 requested by the user; one turboprop and one piston preset
 * so every engine mode has an example.
 */
export const PRESETS: AircraftPreset[] = [
  {
    id: 'a350-1000',
    name: 'Airbus A350-1000',
    description: 'Wide-body twinjet · Rolls-Royce Trent XWB-97 ×2',
    mode: 'turbofan',
    values: {
      W: 703_300,      // lb, max take-off weight (~319 t)
      S: 4_757,        // ft² (~442 m²)
      Cd0: 0.020,
      K: 0.039,        // AR ≈ 9.5, e ≈ 0.85
      CLmax: 1.4,      // clean configuration
      h: 35_000,       // ft, typical cruise
      Tv0: 96_900,     // lb per engine (~431 kN) — ×2 internally
      n: 0.6,
      A: 0.5,
      m: 0.6,
      W0: 600_000,     // lb, cruise start weight (approx.)
      Wf: 150_000,     // lb, cruise fuel (approx.)
      Ct: 0.55,        // lb/lb·hr, cruise TSFC (approx.)
    },
  },
  {
    id: 'atr72-600',
    name: 'ATR 72-600',
    description: 'Regional turboprop · PW127F ×2',
    mode: 'turboprop',
    values: {
      W: 50_700,       // lb, MTOW (~23 t)
      S: 796.5,        // ft² (~74 m²)
      Cd0: 0.025,
      K: 0.040,        // AR ≈ 9.9, e ≈ 0.8
      CLmax: 1.6,
      h: 5_000,        // ft
      Psh: 2_750,      // shp per engine
      Ne: 2,
      eta: 0.85,
      jetRatio: 0.04,
      m: 0.6,
      W0: 45_000,      // lb (approx.)
      Wf: 8_000,       // lb (approx.)
      c: 0.50,         // lb/hp·hr (approx.)
    },
  },
  {
    id: 'c172',
    name: 'Cessna 172 Skyhawk',
    description: 'Light piston single · Lycoming IO-360',
    mode: 'piston',
    values: {
      W: 2_550,        // lb, MTOW
      S: 174,          // ft²
      Cd0: 0.031,
      K: 0.054,        // AR ≈ 7.4, e ≈ 0.8
      CLmax: 1.6,
      h: 5_000,        // ft
      P0: 160,         // hp
      eta: 0.80,
      W0: 2_400,       // lb
      Wf: 300,         // lb
      c: 0.45,         // lb/hp·hr
    },
  },
];
