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
import { toDisplay, powerDisp, climbRate, unitOf, powerDispUnit, climbRateUnit, type UnitSystem } from '@/lib/units';
import type { PerformanceResults } from '@/lib/performanceCalculations';
import type { EngineMode } from './AircraftAnalyzer';

interface PerformanceChartsProps {
  results: PerformanceResults;
  mode: EngineMode;
  sys: UnitSystem;
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

/** Trim trailing zeros for metric tick labels (30.48 -> "30.48", 60.96 -> "60.96", 100 -> "100"). */
const tickFmt = (v: number, sys: UnitSystem): string => {
  if (sys === 'imperial') return v.toFixed(0);
  return Number(v.toFixed(2)).toString();
};

export function PerformanceCharts({ results, mode, sys }: PerformanceChartsProps) {
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

  const uSpd = unitOf('speed', sys);
  const uThr = unitOf('thrust', sys);
  const uPwr = powerDispUnit(sys);
  const uRC = climbRateUnit(sys);
  const uAlt = unitOf('altitude', sys);

  // Display-unit converters (internal British -> shown units)
  const vDisp = (v: number) => toDisplay(v, 'speed', sys);
  const tDisp = (v: number) => toDisplay(v, 'thrust', sys);
  const hDispMain = toDisplay(results.h_m / 0.3048, 'altitude', sys);

  // Chart velocity ranges by engine type (matching MATLAB + tables)
  // Turbofan: 0 to 1200 internal ft/s, step 100 — Turboprop & Piston: 0 to 600, step 50
  const vMaxInternal = mode === 'turbofan' ? 1200 : 600;
  const vStepInternal = mode === 'turbofan' ? 100 : 50;
  const vMax = vDisp(vMaxInternal);

  const thrustData = useMemo(() => {
    const alt = new Map<number, { TA: number; TR: number }>();
    results.chartDataSL.forEach(d => alt.set(d.V, { TA: Math.max(0, d.TA), TR: d.TR }));
    return results.chartData
      .filter(d => d.V >= 0 && d.V <= vMaxInternal)
      .map(d => ({
        V: vDisp(d.V),
        TA: tDisp(Math.max(0, d.TA)),
        TR: tDisp(d.TR),
        'TA_SL': alt.has(d.V) ? tDisp(alt.get(d.V)!.TA) : undefined,
        'TR_SL': alt.has(d.V) ? tDisp(alt.get(d.V)!.TR) : undefined,
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.chartData, results.chartDataSL, sys, vMaxInternal]);

  const powerData = useMemo(() => {
    const alt = new Map<number, { PA: number; PR: number }>();
    results.chartDataSL.forEach(d => alt.set(d.V, { PA: d.PA, PR: d.PR }));
    return results.chartData
      .filter(d => d.V >= 0 && d.V <= vMaxInternal)
      .map(d => ({
        V: vDisp(d.V),
        PA: powerDisp(Math.max(0, d.PA), sys),
        PR: powerDisp(d.PR, sys),
        'PA_SL': alt.has(d.V) ? powerDisp(alt.get(d.V)!.PA, sys) : undefined,
        'PR_SL': alt.has(d.V) ? powerDisp(alt.get(d.V)!.PR, sys) : undefined,
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.chartData, results.chartDataSL, sys, vMaxInternal]);

  const climbData = useMemo(() => {
    return results.chartData
      .filter(d => d.V >= results.Vstall && d.V <= results.Vmax && d.V >= 0 && d.V <= vMaxInternal)
      .map(d => ({ V_h: vDisp(d.V_h), RC: climbRate(Math.max(0, d.RC), sys) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, sys, vMaxInternal]);

  const glideData = useMemo(() => {
    return results.glideData
      .filter(d => d.V >= results.Vstall && d.V <= vMaxInternal)
      .map(d => ({ V_h: vDisp(d.V_h), V_v: vDisp(d.V_v) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, sys, vMaxInternal]);

  // Ceiling curve: X = altitude (kft / km), Y = R/C (ft/min / m/s)
  const ceilingData = useMemo(() => {
    return results.ceilingData.map(d => ({
      altitude: toDisplay(d.altitude, 'ceiling', sys),
      RC: climbRate(d.RC, sys),
    }));
  }, [results.ceilingData, sys]);

  // Ticks: exact converted values of the internal step grid (0..vMaxInternal).
  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let v = 0; v <= vMaxInternal; v += vStepInternal) {
      ticks.push(vDisp(v));
    }
    return ticks;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sys, vMaxInternal, vStepInternal]);

  const refLabel = (value: string, color: string) => ({
    value,
    fill: color,
    fontSize: 9,
    fontWeight: 600,
  });

  const ceilSvc = toDisplay(results.serviceCeiling, 'ceiling', sys);
  const ceilAbs = toDisplay(results.absoluteCeiling, 'ceiling', sys);

  return (
    <div className="aviation-card animate-fade-in min-w-0">
      <h3 className="section-title mb-6">
        Performance Charts (at {hDispMain.toFixed(0)} {uAlt})
      </h3>

      <div className="grid md:grid-cols-2 gap-6 min-w-0">
        {/* Thrust Required vs Available */}
        <div className="chart-container min-w-0">
          <h4 className="text-sm font-semibold text-center text-muted-foreground mb-3">
            Thrust Required vs Available
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={thrustData} margin={{ top: 5, right: 20, left: 10, bottom: 32 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} strokeOpacity={0.5} />
              <XAxis
                dataKey="V"
                stroke={C.axis}
                fontSize={10}
                tickFormatter={(v: number) => tickFmt(v, sys)}
                domain={[0, vMax]}
                ticks={xTicks}
                label={{ ...axisLabelStyle(C.axis), value: `Velocity (${uSpd})`, position: 'bottom', offset: 6 }}
              />
              <YAxis
                stroke={C.axis}
                fontSize={10}
                tickFormatter={fmt}
                label={{ ...axisLabelStyle(C.axis), value: `Thrust (${uThr})`, angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<ChartTooltip unit={uThr} labelUnit={uSpd} />} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Line type="monotone" dataKey="TA" stroke={C.blue} name="TA (altitude)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="TR" stroke={C.amber} name="TR (altitude)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="TA_SL" stroke={C.blue} name="TA (sea level)" dot={false} strokeWidth={1.5} strokeDasharray="6 4" strokeOpacity={0.55} />
              <Line type="monotone" dataKey="TR_SL" stroke={C.amber} name="TR (sea level)" dot={false} strokeWidth={1.5} strokeDasharray="6 4" strokeOpacity={0.55} />
              <ReferenceLine x={vDisp(results.Vstall)} stroke={C.red} strokeDasharray="5 5" label={refLabel(`Vs=${fmt(vDisp(results.Vstall))}`, C.red)} />
              <ReferenceLine x={vDisp(results.Vmax)} stroke={C.green} strokeDasharray="5 5" label={refLabel(`Vmax=${fmt(vDisp(results.Vmax))}`, C.green)} />
              <ReferenceLine x={vDisp(results.VTRmin)} stroke={C.cyan} strokeDasharray="3 3" label={refLabel('VTRmin', C.cyan)} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Power Required vs Available */}
        <div className="chart-container min-w-0">
          <h4 className="text-sm font-semibold text-center text-muted-foreground mb-3">
            Power Required vs Available
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={powerData} margin={{ top: 5, right: 20, left: 10, bottom: 32 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} strokeOpacity={0.5} />
              <XAxis
                dataKey="V"
                stroke={C.axis}
                fontSize={10}
                tickFormatter={(v: number) => tickFmt(v, sys)}
                domain={[0, vMax]}
                ticks={xTicks}
                label={{ ...axisLabelStyle(C.axis), value: `Velocity (${uSpd})`, position: 'bottom', offset: 6 }}
              />
              <YAxis
                stroke={C.axis}
                fontSize={10}
                tickFormatter={fmt}
                label={{ ...axisLabelStyle(C.axis), value: `Power (${uPwr})`, angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<ChartTooltip unit={uPwr} labelUnit={uSpd} />} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Line type="monotone" dataKey="PA" stroke={C.blue} name="PA (altitude)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="PR" stroke={C.amber} name="PR (altitude)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="PA_SL" stroke={C.blue} name="PA (sea level)" dot={false} strokeWidth={1.5} strokeDasharray="6 4" strokeOpacity={0.55} />
              <Line type="monotone" dataKey="PR_SL" stroke={C.amber} name="PR (sea level)" dot={false} strokeWidth={1.5} strokeDasharray="6 4" strokeOpacity={0.55} />
              <ReferenceLine x={vDisp(results.VPRmin)} stroke={C.cyan} strokeDasharray="5 5" label={refLabel(`VPRmin=${fmt(vDisp(results.VPRmin))}`, C.cyan)} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Rate of Climb vs Velocity */}
        <div className="chart-container min-w-0">
          <h4 className="text-sm font-semibold text-center text-muted-foreground mb-3">
            Rate of Climb vs Velocity
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={climbData} margin={{ top: 5, right: 20, left: 10, bottom: 32 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} strokeOpacity={0.5} />
              <XAxis
                dataKey="V_h"
                stroke={C.axis}
                fontSize={10}
                tickFormatter={(v: number) => tickFmt(v, sys)}
                label={{ ...axisLabelStyle(C.axis), value: `Horizontal Velocity (${uSpd})`, position: 'bottom', offset: 6 }}
              />
              <YAxis
                stroke={C.axis}
                fontSize={10}
                tickFormatter={fmt}
                label={{ ...axisLabelStyle(C.axis), value: `R/C (${uRC})`, angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<ChartTooltip unit={uRC} labelUnit={uSpd} />} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Line type="monotone" dataKey="RC" stroke={C.green} name="R/C" dot={false} strokeWidth={2} />
              <ReferenceLine x={vDisp(results.V_RCmax)} stroke={C.cyan} strokeDasharray="5 5" label={refLabel(`V@RCmax=${fmt(vDisp(results.V_RCmax))}`, C.cyan)} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Ceiling: R/C vs Altitude */}
        <div className="chart-container min-w-0">
          <h4 className="text-sm font-semibold text-center text-muted-foreground mb-3">
            Rate of Climb vs Altitude (Ceiling)
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={ceilingData} margin={{ top: 5, right: 20, left: 10, bottom: 32 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} strokeOpacity={0.5} />
              <XAxis
                dataKey="altitude"
                stroke={C.axis}
                fontSize={10}
                tickFormatter={(v: number) => tickFmt(v, sys)}
                label={{ ...axisLabelStyle(C.axis), value: `Altitude (${unitOf('ceiling', sys)})`, position: 'bottom', offset: 6 }}
              />
              <YAxis
                stroke={C.axis}
                fontSize={10}
                tickFormatter={fmt}
                label={{ ...axisLabelStyle(C.axis), value: `R/C (${uRC})`, angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<ChartTooltip unit={uRC} labelUnit={unitOf('ceiling', sys)} />} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Line type="monotone" dataKey="RC" stroke={C.rose} name="R/C" dot={false} strokeWidth={2} />
              <ReferenceLine x={ceilSvc} stroke={C.blue} strokeDasharray="5 5" label={refLabel(`Service: ${ceilSvc.toFixed(1)} ${unitOf('ceiling', sys)}`, C.blue)} />
              <ReferenceLine x={ceilAbs} stroke={C.red} strokeDasharray="5 5" label={refLabel(`Absolute: ${ceilAbs.toFixed(1)} ${unitOf('ceiling', sys)}`, C.red)} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gliding Hodograph */}
        <div className="chart-container md:col-span-2 min-w-0">
          <h4 className="text-sm font-semibold text-center text-muted-foreground mb-3">
            Gliding Hodograph (Sink Rate)
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={glideData} margin={{ top: 5, right: 20, left: 10, bottom: 32 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} strokeOpacity={0.5} />
              <XAxis
                dataKey="V_h"
                stroke={C.axis}
                fontSize={10}
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(v: number) => tickFmt(v, sys)}
                label={{ ...axisLabelStyle(C.axis), value: `Horizontal Velocity (${uSpd})`, position: 'bottom', offset: 6 }}
              />
              <YAxis
                stroke={C.axis}
                fontSize={10}
                domain={['dataMin', 0]}
                tickFormatter={fmt}
                label={{ ...axisLabelStyle(C.axis), value: `Sink Rate (${uSpd})`, angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<ChartTooltip unit={uSpd} labelUnit={uSpd} />} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Line type="monotone" dataKey="V_v" stroke={C.red} name="V_v (sink)" dot={false} strokeWidth={2} />
              <ReferenceLine x={vDisp(results.V_Theta_min_glide)} stroke={C.cyan} strokeDasharray="5 5" label={refLabel('Best glide', C.cyan)} />
              <ReferenceLine x={vDisp(results.V_RD_min)} stroke={C.amber} strokeDasharray="3 3" label={refLabel('Min sink', C.amber)} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
