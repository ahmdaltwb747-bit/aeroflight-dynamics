import { Table } from 'lucide-react';
import type { PerformanceResults, ChartDataPoint, GlideDataPoint } from '@/lib/performanceCalculations';
import type { EngineMode } from './AircraftAnalyzer';

interface PerformanceTablesProps {
  results: PerformanceResults;
  mode: EngineMode;
}

// Sample velocities matching MATLAB:
// Turbofan: 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200
// Turboprop: 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600
const TURBOFAN_VELOCITIES = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200];
const TURBOPROP_VELOCITIES = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600];

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

export function PerformanceTables({ results, mode }: PerformanceTablesProps) {
  // Select velocities based on engine mode
  const sampleVelocities = mode === 'turboprop' ? TURBOPROP_VELOCITIES : TURBOFAN_VELOCITIES;
  
  // Get sample data points at specific velocities
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">V (ft/s)</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">TA (lb)</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">TR (lb)</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">PA (hp)</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">PR (hp)</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">ET (lb)</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">EP (hp)</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">θ (°)</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">R/C (ft/s)</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">V_h (ft/s)</th>
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
                  <td className="px-3 py-2 font-medium text-foreground">{row.V}</td>
                  <td className="px-3 py-2 text-foreground">{row.TA.toFixed(4)}</td>
                  <td className="px-3 py-2 text-foreground">{row.TR.toFixed(4)}</td>
                  <td className="px-3 py-2 text-foreground">{row.PA.toFixed(4)}</td>
                  <td className="px-3 py-2 text-foreground">{row.PR.toFixed(4)}</td>
                  <td className="px-3 py-2 text-foreground">{row.ET.toFixed(1)}</td>
                  <td className="px-3 py-2 text-foreground">{row.EP.toFixed(1)}</td>
                  <td className="px-3 py-2 text-foreground">{row.Theta.toFixed(4)}</td>
                  <td className="px-3 py-2 text-foreground">{row.RC.toFixed(4)}</td>
                  <td className="px-3 py-2 text-foreground">{row.V_h.toFixed(4)}</td>
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
          <table className="w-full text-sm">
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
                  <td className="px-3 py-2 text-foreground">{row.ET_glide.toFixed(4)}</td>
                  <td className="px-3 py-2 text-foreground">{row.Theta.toFixed(4)}</td>
                  <td className="px-3 py-2 text-foreground">{row.V_v.toFixed(4)}</td>
                  <td className="px-3 py-2 text-foreground">{row.V_h.toFixed(4)}</td>
                  <td className="px-3 py-2 text-foreground">{row.RD.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}