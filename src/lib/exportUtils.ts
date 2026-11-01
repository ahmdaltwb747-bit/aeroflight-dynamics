import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PerformanceResults } from './performanceCalculations';
import type { EngineMode, InputValues } from '@/components/AircraftAnalyzer';
import {
  toDisplay, unitOf, climbRate, climbRateUnit, glideRange, glideRangeUnit,
  type UnitSystem,
} from './units';

export interface ExportContext {
  results: PerformanceResults;
  mode: EngineMode;
  inputs: InputValues;
  sys: UnitSystem;
}

const TURBOFAN_V = Array.from({ length: 12 }, (_, i) => (i + 1) * 100);
const PROP_V = Array.from({ length: 12 }, (_, i) => (i + 1) * 50);

const isMetric = (s: UnitSystem) => s === 'metric';
/** Power available/required: internally lb·ft/s -> hp (imperial) or kW (metric). */
const power = (v: number, s: UnitSystem) => (isMetric(s) ? v * 1.35581795 / 1000 : v / 550);
const powerUnit = (s: UnitSystem) => (isMetric(s) ? 'kW' : 'hp');
/** Ceiling: internally ft -> kft (imperial) or km (metric). */
const ceil = (ft: number, s: UnitSystem) => (isMetric(s) ? ft * 0.3048 / 1000 : ft / 1000);
const ceilUnit = (s: UnitSystem) => (isMetric(s) ? 'km' : 'kft');

const fmt = (v: number): string => (isFinite(v) ? String(Number(v.toPrecision(6))) : '—');

const closest = <T extends { V: number }>(data: T[], target: number): T | null => {
  let best: T | null = null;
  let diff = Infinity;
  for (const p of data) {
    const d = Math.abs(p.V - target);
    if (d < diff) { diff = d; best = p; }
  }
  return best;
};

const inputRows = ({ inputs, mode, sys }: ExportContext): Array<Array<string | number>> => {
  const rows: Array<Array<string | number>> = [
    ['Gross weight (W)', fmt(toDisplay(inputs.W, 'weight', sys)), unitOf('weight', sys)],
    ['Wing area (S)', fmt(toDisplay(inputs.S, 'area', sys)), unitOf('area', sys)],
    ['Zero-lift drag coefficient (Cd0)', inputs.Cd0, '—'],
    ['Induced drag factor (K)', inputs.K, '—'],
    ['Max lift coefficient (CL max)', inputs.CLmax, '—'],
    ['Altitude (h)', fmt(toDisplay(inputs.h, 'altitude', sys)), unitOf('altitude', sys)],
    ['Initial weight (W0)', fmt(toDisplay(inputs.W0, 'weight', sys)), unitOf('weight', sys)],
    ['Fuel weight (Wf)', fmt(toDisplay(inputs.Wf, 'weight', sys)), unitOf('weight', sys)],
  ];
  if (mode === 'turbofan') {
    rows.push(
      ['Static thrust per engine (Tv0)', fmt(toDisplay(inputs.Tv0, 'thrust', sys)), unitOf('thrust', sys)],
      ['Thrust decay exponent (n)', inputs.n, '—'],
      ['Atmospheric coefficient (A)', inputs.A, '—'],
      ['Altitude power exponent (m)', inputs.m, '—'],
      ['TSFC (Ct)', fmt(toDisplay(inputs.Ct, 'tsfc', sys)), unitOf('tsfc', sys)],
    );
  } else if (mode === 'turboprop') {
    rows.push(
      ['Shaft power per engine (Psh)', fmt(toDisplay(inputs.Psh, 'power', sys)), unitOf('power', sys)],
      ['Number of engines (Ne)', inputs.Ne, '—'],
      ['Propeller efficiency (η)', inputs.eta, '—'],
      ['Jet power ratio', inputs.jetRatio, '—'],
      ['Altitude power exponent (m)', inputs.m, '—'],
      ['PSFC (c)', fmt(toDisplay(inputs.c, 'psfc', sys)), unitOf('psfc', sys)],
    );
  } else {
    rows.push(
      ['Max shaft power (P0)', fmt(toDisplay(inputs.P0, 'power', sys)), unitOf('power', sys)],
      ['Propeller efficiency (η)', inputs.eta, '—'],
      ['PSFC (c)', fmt(toDisplay(inputs.c, 'psfc', sys)), unitOf('psfc', sys)],
    );
  }
  return rows;
};

const resultRows = ({ results: r, sys }: ExportContext): Array<Array<string | number>> => [
  ['Max speed (Vmax)', fmt(toDisplay(r.Vmax, 'speed', sys)), unitOf('speed', sys)],
  ['Stall speed (Vs)', fmt(toDisplay(r.Vstall, 'speed', sys)), unitOf('speed', sys)],
  ['Max rate of climb (R/C max)', fmt(climbRate(r.RCmax, sys)), climbRateUnit(sys)],
  ['Max glide ratio (CL/CD max)', fmt(r.CLCD_max), '—'],
  ['Thrust constant (C)', fmt(r.C), '—'],
  ['Service ceiling', fmt(ceil(r.serviceCeiling, sys)), ceilUnit(sys)],
  ['Absolute ceiling', fmt(ceil(r.absoluteCeiling, sys)), ceilUnit(sys)],
  ['Max range (R max)', fmt(toDisplay(r.R_max, 'range', sys)), unitOf('range', sys)],
  ['Max endurance (E max)', fmt(r.E_max / 3600), 'hr'],
];

const thrustHeader = (sys: UnitSystem) => [
  `V (${unitOf('speed', sys)})`,
  `TA (${unitOf('thrust', sys)})`,
  `TR (${unitOf('thrust', sys)})`,
  `PA (${powerUnit(sys)})`,
  `PR (${powerUnit(sys)})`,
  `ET (${unitOf('thrust', sys)})`,
  `EP (${powerUnit(sys)})`,
  `θ (°)`,
  `R/C (${climbRateUnit(sys)})`,
  `V_h (${unitOf('speed', sys)})`,
];

const thrustBody = ({ results, mode, sys }: ExportContext) => {
  const vs = mode === 'turbofan' ? TURBOFAN_V : PROP_V;
  return vs
    .map(v => closest(results.chartData, v))
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .map(p => [
      fmt(toDisplay(p.V, 'speed', sys)),
      fmt(toDisplay(p.TA, 'thrust', sys)),
      fmt(toDisplay(p.TR, 'thrust', sys)),
      fmt(power(p.PA, sys)),
      fmt(power(p.PR, sys)),
      fmt(toDisplay(p.ET, 'thrust', sys)),
      fmt(power(p.EP, sys)),
      fmt(p.Theta),
      fmt(climbRate(p.RC, sys)),
      fmt(toDisplay(p.V_h, 'speed', sys)),
    ]);
};

const glideHeader = (sys: UnitSystem) => [
  `V (${unitOf('speed', sys)})`,
  `ET glide (${unitOf('thrust', sys)})`,
  `θ glide (°)`,
  `V_v (${unitOf('speed', sys)})`,
  `V_h (${unitOf('speed', sys)})`,
  `R/D (${climbRateUnit(sys)})`,
];

const glideBody = ({ results, mode, sys }: ExportContext) => {
  const vs = mode === 'turbofan' ? TURBOFAN_V : PROP_V;
  return vs
    .map(v => closest(results.glideData, v))
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .map(p => [
      fmt(toDisplay(p.V, 'speed', sys)),
      fmt(toDisplay(p.ET_glide, 'thrust', sys)),
      fmt(p.Theta),
      fmt(toDisplay(p.V_v, 'speed', sys)),
      fmt(toDisplay(p.V_h, 'speed', sys)),
      fmt(climbRate(p.RD, sys)),
    ]);
};

const modeLabel = (m: EngineMode) => (m === 'turbofan' ? 'Turbofan / Jet' : m === 'turboprop' ? 'Turboprop' : 'Piston');
const sysLabel = (s: UnitSystem) => (isMetric(s) ? 'SI (metric)' : 'Imperial (British)');

export function buildCsv(ctx: ExportContext): string {
  const lines: string[] = [];
  lines.push('Aircraft Performance Analyzer - Results Export');
  lines.push(`Generated,${new Date().toISOString()}`);
  lines.push(`Engine mode,${modeLabel(ctx.mode)}`);
  lines.push(`Unit system,${sysLabel(ctx.sys)}`);
  lines.push('');
  lines.push('INPUTS');
  lines.push('parameter,value,unit');
  inputRows(ctx).forEach(r => lines.push(r.join(',')));
  lines.push('');
  lines.push('KEY RESULTS');
  lines.push('parameter,value,unit');
  resultRows(ctx).forEach(r => lines.push(r.join(',')));
  lines.push('');
  lines.push('PERFORMANCE TABLE (WITH THRUST) - AT ANALYSIS ALTITUDE');
  lines.push(thrustHeader(ctx.sys).join(','));
  thrustBody(ctx).forEach(r => lines.push(r.join(',')));
  lines.push('');
  lines.push('GLIDING TABLE (NO THRUST) - AT ANALYSIS ALTITUDE');
  lines.push(glideHeader(ctx.sys).join(','));
  glideBody(ctx).forEach(r => lines.push(r.join(',')));
  return lines.join('\n');
}

export function buildPdf(ctx: ExportContext): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt' });
  const dark = [30, 58, 95];

  doc.setFontSize(16);
  doc.text('Aircraft Performance Analyzer — Report', 40, 40);
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(
    `Generated: ${new Date().toLocaleString()}   ·   Engine mode: ${modeLabel(ctx.mode)}   ·   Unit system: ${sysLabel(ctx.sys)}`,
    40, 58,
  );
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 74,
    head: [['Input', 'Value', 'Unit']],
    body: inputRows(ctx).map(r => r.map(String)),
    styles: { fontSize: 8 },
    headStyles: { fillColor: dark },
    margin: { left: 40, right: 40 },
  });

  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;
  autoTable(doc, {
    startY: y,
    head: [['Key result', 'Value', 'Unit']],
    body: resultRows(ctx).map(r => r.map(String)),
    styles: { fontSize: 8 },
    headStyles: { fillColor: dark },
    margin: { left: 40, right: 40 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;
  autoTable(doc, {
    startY: y,
    head: [thrustHeader(ctx.sys)],
    body: thrustBody(ctx),
    styles: { fontSize: 7 },
    headStyles: { fillColor: dark },
    margin: { left: 40, right: 40 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;
  autoTable(doc, {
    startY: y,
    head: [glideHeader(ctx.sys)],
    body: glideBody(ctx),
    styles: { fontSize: 7 },
    headStyles: { fillColor: dark },
    margin: { left: 40, right: 40 },
  });

  doc.setFontSize(8);
  doc.setTextColor(110);
  doc.text('For educational purposes only — verify all results before operational use.', 40, doc.internal.pageSize.getHeight() - 20);

  return doc;
}
