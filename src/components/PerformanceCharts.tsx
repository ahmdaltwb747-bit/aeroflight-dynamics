import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { PerformanceResults } from '@/lib/performanceCalculations';
import type { EngineMode } from './AircraftAnalyzer';

interface PerformanceChartsProps {
  results: PerformanceResults;
  mode: EngineMode;
}

// Mid-tone palette that reads well on both light and dark themes
const C = {
  blue: 'hsl(217, 91%, 55%)',
  amber: 'hsl(38, 92%, 42%)',
  green: 'hsl(152, 76%, 34%)',
  cyan: 'hsl(199, 89%, 40%)',
  red: 'hsl(0, 72%, 46%)',
  emerald: 'hsl(142, 71%, 38%)',
  rose: 'hsl(330, 80%, 45%)',
  axis: 'hsl(215, 16%, 47%)',
  grid: 'hsl(215, 20%, 55%)',
};

const fmt = (v: number) => v.toFixed(3);

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; color?: string }>;
  label?: string | number;
  unit?: string;
  labelUnit?: string;
}

function ChartTooltip({ active, payload, label, unit, labelUnit }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="chart-tooltip">
      {label !== undefined && (
        <p className="font-semibold mb-1 border-b border-border pb-1">
          {typeof label === 'number' ? fmt(label) : label}
          {labelUnit ? ` ${labelUnit}` : ''}
        </p>
      )}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-3 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="font-semibold">
            {typeof entry.value === 'number' ? fmt(entry.value) : entry.value}
            {unit ? ` ${unit}` : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PerformanceCharts({ results, mode }: PerformanceChartsProps) {
  // Chart velocity ranges by engine type (matching MATLAB)
  // Turbofan: 0 to 1200 (charts), step 100
  // Turboprop & Piston: 0 to 600 (charts), step 50
  const vMin = 0;
  const vMax = mode === 'turbofan' ? 1200 : 600;
  const vStep = mode === 'turbofan' ? 100 : 50;

  const thrustData = useMemo(() => {
    return results.chartData
      .filter(d => d.V >= vMin && d.V <= vMax)
      .map(d => ({ V: d.V, TA: Math.max(0, d.TA), TR: d.TR }));
  }, [results.chartData, vMin, vMax]);

  const powerData = useMemo(() => {
    return results.chartData
      .filter(d => d.V >= vMin && d.V <= vMax)
      .map(d => ({ V: d.V, PA: Math.max(0, d.PA / 550), PR: d.PR / 550 })); // Convert to hp
  }, [results.chartData, vMin, vMax]);

  const climbData = useMemo(() => {
    return results.chartData
      .filter(d => d.V >= results.Vstall && d.V <= results.Vmax && d.V >= vMin && d.V <= vMax)
      .map(d => ({ V_h: d.V_h, RC: Math.max(0, d.RC * 60) }));
  }, [results, vMin, vMax]);

  const glideData = useMemo(() => {
    return results.glideData
      .filter(d => d.V >= results.Vstall && d.V <= vMax)
      .map(d => ({ V_h: d.V_h, V_v: d.V_v }));
  }, [results, vMax]);

  const ceilingData = useMemo(() => {
    return results.ceilingData.map(d => ({ altitude: d.altitude / 1000, RC: d.RC }));
  }, [results.ceilingData]);

  // Generate ticks based on engine type
  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let v = 0; v <= vMax; v += vStep) {
      ticks.push(v);
    }
    return ticks;
  }, [vMax, vStep]);

  return (
    <div className="aviation-card animate-fade-in">
      <h3 className="section-title mb-6">Performance Charts (at {results.h_m.toFixed(0)}m / {(results.h_m / 0.3048).toFixed(0)}ft)</h3>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Thrust vs Velocity */}
        <div className="chart-container">
          <h4 className="text-sm font-semibold text-center text-muted-foreground mb-3">Thrust vs Velocity</h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={thrustData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} strokeOpacity={0.35} />
              <XAxis dataKey="V" stroke={C.axis} fontSize={10} tickFormatter={fmt} domain={[0, vMax]} ticks={xTicks} />
              <YAxis stroke={C.axis} fontSize={10} tickFormatter={fmt} />
              <Tooltip content={<ChartTooltip unit="lb" labelUnit="ft/s" />} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <ReferenceLine x={results.Vstall} stroke={C.red} strokeDasharray="5 5" label={{ value: `Vs=${fmt(results.Vstall)}`, fill: C.red, fontSize: 9 }} />
              <ReferenceLine x={results.Vmax} stroke={C.emerald} strokeDasharray="5 5" label={{ value: `Vmax=${fmt(results.Vmax)}`, fill: C.emerald, fontSize: 9 }} />
              <ReferenceLine x={results.VTRmin} stroke={C.cyan} strokeDasharray="3 3" label={{ value: `VTRmin`, fill: C.cyan, fontSize: 9 }} />
              <Line type="monotone" dataKey="TA" stroke={C.blue} name="TA" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="TR" stroke={C.amber} name="TR" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Power vs Velocity */}
        <div className="chart-container">
          <h4 className="text-sm font-semibold text-center text-muted-foreground mb-3">Power vs Velocity (hp)</h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={powerData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} strokeOpacity={0.35} />
              <XAxis dataKey="V" stroke={C.axis} fontSize={10} tickFormatter={fmt} domain={[0, vMax]} ticks={xTicks} />
              <YAxis stroke={C.axis} fontSize={10} tickFormatter={fmt} />
              <Tooltip content={<ChartTooltip unit="hp" labelUnit="ft/s" />} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <ReferenceLine x={results.VPRmin} stroke={C.cyan} strokeDasharray="5 5" label={{ value: `VPRmin=${fmt(results.VPRmin)}`, fill: C.cyan, fontSize: 9 }} />
              <Line type="monotone" dataKey="PA" stroke={C.blue} name="PA" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="PR" stroke={C.amber} name="PR" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Rate of Climb */}
        <div className="chart-container">
          <h4 className="text-sm font-semibold text-center text-muted-foreground mb-3">Rate of Climb (ft/min)</h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={climbData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} strokeOpacity={0.35} />
              <XAxis dataKey="V_h" stroke={C.axis} fontSize={10} tickFormatter={fmt} />
              <YAxis stroke={C.axis} fontSize={10} tickFormatter={fmt} />
              <Tooltip content={<ChartTooltip unit="ft/min" labelUnit="ft/s" />} />
              <Line type="monotone" dataKey="RC" stroke={C.green} name="R/C" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Ceiling Graph */}
        <div className="chart-container">
          <h4 className="text-sm font-semibold text-center text-muted-foreground mb-3">Rate of Climb vs Altitude</h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={ceilingData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} strokeOpacity={0.35} />
              <XAxis dataKey="RC" stroke={C.axis} fontSize={10} tickFormatter={fmt} label={{ value: 'R/C (ft/s)', position: 'insideBottom', offset: -5, fill: C.axis, fontSize: 9 }} />
              <YAxis stroke={C.axis} fontSize={10} tickFormatter={fmt} label={{ value: 'Alt (kft)', angle: -90, position: 'insideLeft', fill: C.axis, fontSize: 9 }} />
              <Tooltip content={<ChartTooltip unit="kft" labelUnit="ft/s" />} />
              <ReferenceLine y={results.serviceCeiling / 1000} stroke={C.blue} strokeDasharray="5 5" label={{ value: `Service: ${(results.serviceCeiling/1000).toFixed(1)}kft`, fill: C.blue, fontSize: 9 }} />
              <ReferenceLine y={results.absoluteCeiling / 1000} stroke={C.red} strokeDasharray="5 5" label={{ value: `Absolute: ${(results.absoluteCeiling/1000).toFixed(1)}kft`, fill: C.red, fontSize: 9 }} />
              <Line type="monotone" dataKey="altitude" stroke={C.rose} name="Altitude" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gliding Hodograph */}
        <div className="chart-container md:col-span-2">
          <h4 className="text-sm font-semibold text-center text-muted-foreground mb-3">Gliding Hodograph (Sink Rate)</h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={glideData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} strokeOpacity={0.35} />
              <XAxis dataKey="V_h" stroke={C.axis} fontSize={10} type="number" domain={['dataMin', 'dataMax']} tickFormatter={fmt} />
              <YAxis stroke={C.axis} fontSize={10} domain={['dataMin', 0]} tickFormatter={fmt} />
              <Tooltip content={<ChartTooltip unit="ft/s" labelUnit="ft/s" />} />
              <Line type="monotone" dataKey="V_v" stroke={C.red} name="V_v (Sink)" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
