import { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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

/** Re-renders charts when the `.dark` class on <html> changes. */
function useIsDark() {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains('dark'))
    );
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

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
        <p className="font-semibold mb-1 border-b border-border pb-1 font-mono">
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

/** Shared axis label styling */
const axisLabelStyle = (color: string) => ({
  value: '',
  fill: color,
  fontSize: 10,
  fontWeight: 600,
});

export function PerformanceCharts({ results, mode }: PerformanceChartsProps) {
  const isDark = useIsDark();

  // Theme-reactive palette — mid-tone series colors work on both, chrome adapts.
  const C = useMemo(
    () => ({
      blue: isDark ? 'hsl(217, 91%, 65%)' : 'hsl(217, 91%, 50%)',
      amber: isDark ? 'hsl(38, 92%, 55%)' : 'hsl(38, 92%, 42%)',
      green: isDark ? 'hsl(152, 76%, 50%)' : 'hsl(152, 76%, 34%)',
      cyan: isDark ? 'hsl(199, 89%, 55%)' : 'hsl(199, 89%, 40%)',
      red: isDark ? 'hsl(0, 72%, 58%)' : 'hsl(0, 72%, 46%)',
      rose: isDark ? 'hsl(330, 80%, 60%)' : 'hsl(330, 80%, 45%)',
      axis: isDark ? 'hsl(215, 20%, 65%)' : 'hsl(215, 16%, 42%)',
      grid: isDark ? 'hsl(220, 14%, 28%)' : 'hsl(215, 20%, 78%)',
    }),
    [isDark]
  );

  // Chart velocity ranges by engine type (matching MATLAB)
  // Turbofan: 0 to 1200 (charts), step 100
  // Turboprop & Piston: 0 to 600 (charts), step 50
  const vMin = 0;
  const vMax = mode === 'turbofan' ? 1200 : 600;
  const vStep = mode === 'turbofan' ? 100 : 50;

  const thrustData = useMemo(() => {
    const alt = new Map<number, { TA: number; TR: number }>();
    results.chartDataSL.forEach(d => alt.set(d.V, { TA: Math.max(0, d.TA), TR: d.TR }));
    return results.chartData
      .filter(d => d.V >= vMin && d.V <= vMax)
      .map(d => ({
        V: d.V,
        TA: Math.max(0, d.TA),
        TR: d.TR,
        'TA_SL': alt.get(d.V)?.TA,
        'TR_SL': alt.get(d.V)?.TR,
      }));
  }, [results.chartData, results.chartDataSL, vMin, vMax]);

  const powerData = useMemo(() => {
    const alt = new Map<number, { PA: number; PR: number }>();
    results.chartDataSL.forEach(d => alt.set(d.V, { PA: d.PA / 550, PR: d.PR / 550 }));
    return results.chartData
      .filter(d => d.V >= vMin && d.V <= vMax)
      .map(d => ({
        V: d.V,
        PA: Math.max(0, d.PA / 550),
        PR: d.PR / 550,
        'PA_SL': alt.get(d.V)?.PA,
        'PR_SL': alt.get(d.V)?.PR,
      }));
  }, [results.chartData, results.chartDataSL, vMin, vMax]);

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

  // Ceiling curve: X = altitude (kft), Y = R/C (ft/min)
  const ceilingData = useMemo(() => {
    return results.ceilingData.map(d => ({
      altitude: d.altitude / 1000,
      RC: d.RC * 60,
    }));
  }, [results.ceilingData]);

  // Generate ticks based on engine type
  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let v = 0; v <= vMax; v += vStep) {
      ticks.push(v);
    }
    return ticks;
  }, [vMax, vStep]);

  const refLabel = (value: string, color: string) => ({
    value,
    fill: color,
    fontSize: 9,
    fontWeight: 600,
  });

  return (
    <div className="aviation-card animate-fade-in min-w-0">
      <h3 className="section-title mb-6">
        Performance Charts (at {results.h_m.toFixed(0)}m / {(results.h_m / 0.3048).toFixed(0)}ft)
      </h3>

      <div className="grid md:grid-cols-2 gap-6 min-w-0">
        {/* Thrust Required vs Available */}
        <div className="chart-container min-w-0">
          <h4 className="text-sm font-semibold text-center text-muted-foreground mb-3">
            Thrust Required vs Available
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={thrustData} margin={{ top: 5, right: 20, left: 10, bottom: 18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} strokeOpacity={0.5} />
              <XAxis
                dataKey="V"
                stroke={C.axis}
                fontSize={10}
                tickFormatter={fmt}
                domain={[0, vMax]}
                ticks={xTicks}
                label={{ ...axisLabelStyle(C.axis), value: 'Velocity (ft/s)', position: 'insideBottom', offset: -8 }}
              />
              <YAxis
                stroke={C.axis}
                fontSize={10}
                tickFormatter={fmt}
                label={{ ...axisLabelStyle(C.axis), value: 'Thrust (lb)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<ChartTooltip unit="lb" labelUnit="ft/s" />} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Line type="monotone" dataKey="TA" stroke={C.blue} name="TA (altitude)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="TR" stroke={C.amber} name="TR (altitude)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="TA_SL" stroke={C.blue} name="TA (sea level)" dot={false} strokeWidth={1.5} strokeDasharray="6 4" strokeOpacity={0.55} />
              <Line type="monotone" dataKey="TR_SL" stroke={C.amber} name="TR (sea level)" dot={false} strokeWidth={1.5} strokeDasharray="6 4" strokeOpacity={0.55} />
              <ReferenceLine x={results.Vstall} stroke={C.red} strokeDasharray="5 5" label={refLabel(`Vs=${fmt(results.Vstall)}`, C.red)} />
              <ReferenceLine x={results.Vmax} stroke={C.green} strokeDasharray="5 5" label={refLabel(`Vmax=${fmt(results.Vmax)}`, C.green)} />
              <ReferenceLine x={results.VTRmin} stroke={C.cyan} strokeDasharray="3 3" label={refLabel('VTRmin', C.cyan)} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Power Required vs Available */}
        <div className="chart-container min-w-0">
          <h4 className="text-sm font-semibold text-center text-muted-foreground mb-3">
            Power Required vs Available
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={powerData} margin={{ top: 5, right: 20, left: 10, bottom: 18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} strokeOpacity={0.5} />
              <XAxis
                dataKey="V"
                stroke={C.axis}
                fontSize={10}
                tickFormatter={fmt}
                domain={[0, vMax]}
                ticks={xTicks}
                label={{ ...axisLabelStyle(C.axis), value: 'Velocity (ft/s)', position: 'insideBottom', offset: -8 }}
              />
              <YAxis
                stroke={C.axis}
                fontSize={10}
                tickFormatter={fmt}
                label={{ ...axisLabelStyle(C.axis), value: 'Power (hp)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<ChartTooltip unit="hp" labelUnit="ft/s" />} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Line type="monotone" dataKey="PA" stroke={C.blue} name="PA (altitude)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="PR" stroke={C.amber} name="PR (altitude)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="PA_SL" stroke={C.blue} name="PA (sea level)" dot={false} strokeWidth={1.5} strokeDasharray="6 4" strokeOpacity={0.55} />
              <Line type="monotone" dataKey="PR_SL" stroke={C.amber} name="PR (sea level)" dot={false} strokeWidth={1.5} strokeDasharray="6 4" strokeOpacity={0.55} />
              <ReferenceLine x={results.VPRmin} stroke={C.cyan} strokeDasharray="5 5" label={refLabel(`VPRmin=${fmt(results.VPRmin)}`, C.cyan)} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Rate of Climb vs Velocity */}
        <div className="chart-container min-w-0">
          <h4 className="text-sm font-semibold text-center text-muted-foreground mb-3">
            Rate of Climb vs Velocity
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={climbData} margin={{ top: 5, right: 20, left: 10, bottom: 18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} strokeOpacity={0.5} />
              <XAxis
                dataKey="V_h"
                stroke={C.axis}
                fontSize={10}
                tickFormatter={fmt}
                label={{ ...axisLabelStyle(C.axis), value: 'Horizontal Velocity (ft/s)', position: 'insideBottom', offset: -8 }}
              />
              <YAxis
                stroke={C.axis}
                fontSize={10}
                tickFormatter={fmt}
                label={{ ...axisLabelStyle(C.axis), value: 'R/C (ft/min)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<ChartTooltip unit="ft/min" labelUnit="ft/s" />} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Line type="monotone" dataKey="RC" stroke={C.green} name="R/C" dot={false} strokeWidth={2} />
              <ReferenceLine x={results.V_RCmax} stroke={C.cyan} strokeDasharray="5 5" label={refLabel(`V@RCmax=${fmt(results.V_RCmax)}`, C.cyan)} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Ceiling: R/C vs Altitude */}
        <div className="chart-container min-w-0">
          <h4 className="text-sm font-semibold text-center text-muted-foreground mb-3">
            Rate of Climb vs Altitude (Ceiling)
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={ceilingData} margin={{ top: 5, right: 20, left: 10, bottom: 18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} strokeOpacity={0.5} />
              <XAxis
                dataKey="altitude"
                stroke={C.axis}
                fontSize={10}
                tickFormatter={fmt}
                label={{ ...axisLabelStyle(C.axis), value: 'Altitude (kft)', position: 'insideBottom', offset: -8 }}
              />
              <YAxis
                stroke={C.axis}
                fontSize={10}
                tickFormatter={fmt}
                label={{ ...axisLabelStyle(C.axis), value: 'R/C (ft/min)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<ChartTooltip unit="ft/min" labelUnit="kft" />} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Line type="monotone" dataKey="RC" stroke={C.rose} name="R/C" dot={false} strokeWidth={2} />
              <ReferenceLine x={results.serviceCeiling / 1000} stroke={C.blue} strokeDasharray="5 5" label={refLabel(`Service: ${(results.serviceCeiling / 1000).toFixed(1)} kft`, C.blue)} />
              <ReferenceLine x={results.absoluteCeiling / 1000} stroke={C.red} strokeDasharray="5 5" label={refLabel(`Absolute: ${(results.absoluteCeiling / 1000).toFixed(1)} kft`, C.red)} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gliding Hodograph */}
        <div className="chart-container md:col-span-2 min-w-0">
          <h4 className="text-sm font-semibold text-center text-muted-foreground mb-3">
            Gliding Hodograph (Sink Rate)
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={glideData} margin={{ top: 5, right: 20, left: 10, bottom: 18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} strokeOpacity={0.5} />
              <XAxis
                dataKey="V_h"
                stroke={C.axis}
                fontSize={10}
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={fmt}
                label={{ ...axisLabelStyle(C.axis), value: 'Horizontal Velocity (ft/s)', position: 'insideBottom', offset: -8 }}
              />
              <YAxis
                stroke={C.axis}
                fontSize={10}
                domain={['dataMin', 0]}
                tickFormatter={fmt}
                label={{ ...axisLabelStyle(C.axis), value: 'Sink Rate (ft/s)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<ChartTooltip unit="ft/s" labelUnit="ft/s" />} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Line type="monotone" dataKey="V_v" stroke={C.red} name="V_v (sink)" dot={false} strokeWidth={2} />
              <ReferenceLine x={results.V_Theta_min_glide} stroke={C.cyan} strokeDasharray="5 5" label={refLabel('Best glide', C.cyan)} />
              <ReferenceLine x={results.V_RD_min} stroke={C.amber} strokeDasharray="3 3" label={refLabel('Min sink', C.amber)} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
