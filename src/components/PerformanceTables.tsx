import { Table } from 'lucide-react';
import type { PerformanceResults, ChartDataPoint, GlideDataPoint } from '@/lib/performanceCalculations';
import type { EngineMode } from './AircraftAnalyzer';

interface PerformanceTablesProps {
  results: PerformanceResults;
  mode: EngineMode;
}

// Sample velocities matching MATLAB exactly:
// Turbofan: 100 to 1200, step 100 (MATLAB: VL= [100;200;300;...;1200])
const TURBOFAN_VELOCITIES = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200];
// Turboprop: 50 to 600, step 50
const TURBOPROP_VELOCITIES = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600];
// Piston: 50 to 600, step 50
const PISTON_VELOCITIES = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600];

function findClosestDataPoint<T extends { V: number }>(data: T[], targetV: number): T | null {
  let closest: T | null = null;
  let minDiff = Infinity;
  
  for (const point of data) {
    const diff = Math.abs(point.V - targetV);
    if (diff < minDiff) {
      minDiff = diff;
      closest = point;
    }
  }
  return closest;
}

// Format number with 3 decimal places
function fmt(val: number): string {
  return val.toFixed(3);
}

export function PerformanceTables({ results, mode }: PerformanceTablesProps) {
  const sampleVelocities = mode === 'turboprop' ? TURBOPROP_VELOCITIES : 
                           mode === 'piston' ? PISTON_VELOCITIES : TURBOFAN_VELOCITIES;
  
  const thrustTableData = sampleVelocities.map(v => {
    const point = findClosestDataPoint(results.chartData, v);
    return point;
  }).filter((p): p is ChartDataPoint => p !== null);

  const glideTableData = sampleVelocities.map(v => {
    const point = findClosestDataPoint(results.glideData, v);
    return point;
  }).filter((p): p is GlideDataPoint => p !== null);

  return (
    <div className="space-y-6">
      {/* Performance Table (With Thrust) */}
      <div className="aviation-card">
        <div className="flex items-center gap-2 mb-4">
          <Table className="w-5 h-5 text-primary" />
          <h3 className="section-title">Performance Table (With Thrust)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground">V (ft/s)</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground">TA (lb)</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground">TR (lb)</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground">PA (lb.ft/s)</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground">PR (lb.ft/s)</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground">ET (lb)</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground">EP (lb.ft/s)</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground">θ (°)</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground">R/C (ft/s)</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground">V_h (ft/s)</th>
              </tr>
            </thead>
            <tbody>
              {thrustTableData.map((row, idx) => (
                <tr 
                  key={row.V}
                  className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                    idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                  }`}
                >
                  <td className="px-2 py-2 font-medium text-foreground">{row.V}</td>
                  <td className="px-2 py-2 text-foreground font-mono text-xs">{fmt(row.TA)}</td>
                  <td className="px-2 py-2 text-foreground font-mono text-xs">{fmt(row.TR)}</td>
                  <td className="px-2 py-2 text-foreground font-mono text-xs">{fmt(row.PA)}</td>
                  <td className="px-2 py-2 text-foreground font-mono text-xs">{fmt(row.PR)}</td>
                  <td className="px-2 py-2 text-foreground font-mono text-xs">{fmt(row.ET)}</td>
                  <td className="px-2 py-2 text-foreground font-mono text-xs">{fmt(row.EP)}</td>
                  <td className="px-2 py-2 text-foreground font-mono text-xs">{fmt(row.Theta)}</td>
                  <td className="px-2 py-2 text-foreground font-mono text-xs">{fmt(row.RC)}</td>
                  <td className="px-2 py-2 text-foreground font-mono text-xs">{fmt(row.V_h)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gliding Table (No Thrust) */}
      <div className="aviation-card">
        <div className="flex items-center gap-2 mb-4">
          <Table className="w-5 h-5 text-destructive" />
          <h3 className="section-title">Gliding Table (No Thrust)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">V (ft/s)</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">ET_glide (lb)</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">θ_glide (°)</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">V_v (ft/s)</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">V_h (ft/s)</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">R/D (ft/s)</th>
              </tr>
            </thead>
            <tbody>
              {glideTableData.map((row, idx) => (
                <tr 
                  key={row.V}
                  className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                    idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                  }`}
                >
                  <td className="px-3 py-2 font-medium text-foreground">{row.V}</td>
                  <td className="px-3 py-2 text-foreground font-mono text-xs">{fmt(row.ET_glide)}</td>
                  <td className="px-3 py-2 text-foreground font-mono text-xs">{fmt(row.Theta)}</td>
                  <td className="px-3 py-2 text-foreground font-mono text-xs">{fmt(row.V_v)}</td>
                  <td className="px-3 py-2 text-foreground font-mono text-xs">{fmt(row.V_h)}</td>
                  <td className="px-3 py-2 text-foreground font-mono text-xs">{fmt(row.RD)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
