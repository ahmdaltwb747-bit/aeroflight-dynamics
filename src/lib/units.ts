// Unit conversion layer.
// All internal calculations stay in British (Imperial) units — this module
// only converts values at the display/input boundary.

export type UnitSystem = 'imperial' | 'metric';

export type UnitCategory =
  | 'none'
  | 'weight'      // lb <-> kg
  | 'area'        // ft² <-> m²
  | 'altitude'    // ft <-> m
  | 'thrust'      // lb (lbf) <-> N
  | 'power'       // hp <-> kW
  | 'powerRate'   // lb·ft/s <-> kW
  | 'speed'       // ft/s <-> m/s
  | 'tsfc'        // lb/(lb·hr) <-> mg/(N·s)
  | 'psfc'        // lb/(hp·hr) <-> g/(kW·s)
  | 'range'       // ft <-> km
  | 'ceiling'     // ft <-> km (imperial shown as kft at call sites)
  | 'density'     // slug/ft³ <-> kg/m³
  | 'temperature'; // °R <-> K

const LB_PER_KG = 2.2046226218;
const FT_PER_M = 3.280839895;
const LBF_PER_N = 4.4482216153;
const HP_PER_KW = 1.3410220888;
const SLUGFT3_PER_KGM3 = 0.00194032; // slug/ft³ per kg/m³
// 1 lb/(lb·hr) = 0.45359237 kg / (4.4482216 N × 3600 s) = 28.3255 mg/(N·s)
const TSFC_MGNS_PER_UNIT = 28.3255;
// 1 lb/(hp·hr) = 0.45359237 kg / (0.7457 kW × 3600 s) = 0.168966 g/(kW·s)
const PSFC_GKWS_PER_UNIT = 0.168966;

export const unitOf = (cat: UnitCategory, sys: UnitSystem): string => {
  if (cat === 'none') return '';
  const imperial: Record<Exclude<UnitCategory, 'none'>, string> = {
    weight: 'lb', area: 'ft²', altitude: 'ft', thrust: 'lb', power: 'hp',
    powerRate: 'lb·ft/s', speed: 'ft/s', tsfc: 'lb/lb·hr', psfc: 'lb/hp·hr',
    range: 'ft', ceiling: 'kft', density: 'slug/ft³', temperature: '°R',
  };
  const metric: Record<Exclude<UnitCategory, 'none'>, string> = {
    weight: 'kg', area: 'm²', altitude: 'm', thrust: 'N', power: 'kW',
    powerRate: 'kW', speed: 'm/s', tsfc: 'mg/(N·s)', psfc: 'g/(kW·s)',
    range: 'km', ceiling: 'km', density: 'kg/m³', temperature: 'K',
  };
  return sys === 'imperial' ? imperial[cat] : metric[cat];
};

/** Internal (Imperial) value -> value shown to the user. */
export const toDisplay = (v: number, cat: UnitCategory, sys: UnitSystem): number => {
  if (cat === 'none') return v;
  if (sys === 'imperial' && cat !== 'ceiling') return v;
  switch (cat) {
    case 'weight': return v / LB_PER_KG;
    case 'area': return v / (FT_PER_M * FT_PER_M);
    case 'altitude': return v / FT_PER_M;
    case 'thrust': return v / LBF_PER_N;
    case 'power': return v / HP_PER_KW;
    case 'powerRate': return v * 1.35581795 / 1000;
    case 'speed': return v / FT_PER_M;
    case 'tsfc': return v * TSFC_MGNS_PER_UNIT;
    case 'psfc': return v * PSFC_GKWS_PER_UNIT;
    case 'range': return v * 0.3048 / 1000;
    case 'ceiling': return sys === 'imperial' ? v / 1000 : v * 0.3048 / 1000;
    case 'density': return v / SLUGFT3_PER_KGM3;
    case 'temperature': return v * 5 / 9;
  }
};

/** Value shown to the user -> internal (Imperial) value. */
export const fromDisplay = (v: number, cat: UnitCategory, sys: UnitSystem): number => {
  if (cat === 'none' || sys === 'imperial') return v;
  switch (cat) {
    case 'weight': return v * LB_PER_KG;
    case 'area': return v * FT_PER_M * FT_PER_M;
    case 'altitude': return v * FT_PER_M;
    case 'thrust': return v * LBF_PER_N;
    case 'power': return v * HP_PER_KW;
    case 'powerRate': return v * 1000 / 1.35581795;
    case 'speed': return v * FT_PER_M;
    case 'tsfc': return v / TSFC_MGNS_PER_UNIT;
    case 'psfc': return v / PSFC_GKWS_PER_UNIT;
    case 'range': return v * 1000 / 0.3048;
    case 'ceiling': return v * 1000 / 0.3048;
    case 'density': return v * SLUGFT3_PER_KGM3;
    case 'temperature': return v * 9 / 5;
  }
};

/** Statute miles (imperial) or km (metric) for glide range. */
export const glideRange = (v: number, sys: UnitSystem): number =>
  sys === 'imperial' ? v / 5280 : v * 0.3048 / 1000;
export const glideRangeUnit = (sys: UnitSystem): string =>
  sys === 'imperial' ? 'miles' : 'km';

/** ft/min (imperial) or m/s (metric) for rate-of-climb readouts. */
export const climbRate = (ftPerSec: number, sys: UnitSystem): number =>
  sys === 'imperial' ? ftPerSec * 60 : ftPerSec * 0.3048;
export const climbRateUnit = (sys: UnitSystem): string =>
  sys === 'imperial' ? 'ft/min' : 'm/s';

/** Excess/available power from internal lb·ft/s: hp (imperial) or kW (metric). */
export const powerDisp = (lbFtS: number, sys: UnitSystem): number =>
  sys === 'imperial' ? lbFtS / 550 : (lbFtS * 1.35581795) / 1000;
export const powerDispUnit = (sys: UnitSystem): string =>
  sys === 'imperial' ? 'hp' : 'kW';

/** Clean float noise for displaying converted input values. */
export const cleanInput = (v: number): number =>
  isFinite(v) ? Number(v.toPrecision(8)) : 0;

/** Format helper — 3 decimals, thousands-friendly for large numbers. */
export const fmt3 = (v: number): string => {
  if (!isFinite(v)) return '—';
  if (Math.abs(v) >= 10000) return v.toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  return v.toFixed(3);
};
