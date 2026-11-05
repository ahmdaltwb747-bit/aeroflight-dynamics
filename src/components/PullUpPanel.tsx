import { useEffect, useMemo, useState } from 'react';
import { RotateCw, Gauge, Info } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import { toDisplay, unitOf, fmt3, type UnitSystem } from '@/lib/units';
import type { PullUpResults } from '@/lib/performanceCalculations';

interface PullUpPanelProps {
  pullUp: PullUpResults | null;
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

function ResultRow({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="result-row">
      <span className="result-label">{label}</span>
      <span className="result-value">
        {value}
        {unit && <span className="text-muted-foreground ml-1">{unit}</span>}
      </span>
    </div>
  );
}

interface CurveTooltipProps {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string | number;
}

function CurveTooltip({ active, payload, label }: CurveTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="chart-tooltip">
      <p className="font-semibold mb-1 border-b border-border pb-1 font-mono">n = {label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-3 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="font-semibold">
            {typeof entry.value === 'number' ? entry.value.toLocaleString('en-US', { maximumFractionDigits: 4 }) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PullUpPanel({ pullUp, sys }: PullUpPanelProps) {
  const isDark = useIsDark();

  const C = useMemo(
    () => ({
      blue: isDark ? 'hsl(217, 91%, 65%)' : 'hsl(217, 91%, 50%)',
      green: isDark ? 'hsl(152, 76%, 50%)' : 'hsl(152, 76%, 34%)',
      axis: isDark ? 'hsl(215, 20%, 65%)' : 'hsl(215, 16%, 42%)',
      grid: isDark ? 'hsl(220, 14%, 28%)' : 'hsl(215, 20%, 78%)',
    }),
    [isDark]
  );

  const uSpd = unitOf('speed', sys);
  const uThr = unitOf('thrust', sys);
  const uRng = unitOf('range', sys);

  // Radius in display units: ft (imperial) / km (metric)
  const rDisp = (v: number) => toDisplay(v, 'range', sys);

  if (!pullUp) {
    return (
      <div className="aviation-card">
        <div className="flex items-center gap-2 mb-3">
          <RotateCw className="w-5 h-5 text-turboprop" />
          <h3 className="section-title">Pull-Up Maneuver</h3>
        </div>
        <div className="flex items-start gap-3 text-sm text-muted-foreground">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-info" />
          <p>
            Enter a <strong className="text-foreground">Mach number</strong> in the Pull-Up Maneuver section on the left,
            then run the analysis to compute flight speed, maximum lift, load factor, pull-up radius and turn rate.
          </p>
        </div>
      </div>
    );
  }

  const u = pullUp; // shorthand
  const qDisp = sys === 'imperial' ? u.q.toFixed(2) : (u.q * 47.8803).toFixed(1);
  const qUnit = sys === 'imperial' ? 'lb/ft²' : 'Pa';

  const rTick = (v: number) => {
    if (sys === 'imperial') {
      return Math.abs(v) >= 10000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0);
    }
    return v >= 10 ? v.toFixed(0) : v.toFixed(1);
  };

  return (
    <div className="aviation-card space-y-5">
      <div className="flex items-center gap-2">
        <RotateCw className="w-5 h-5 text-turboprop" />
        <h3 className="section-title">Pull-Up Maneuver</h3>
      </div>

      {!u.canPullUp && (
        <p className="text-xs text-warning">
          ⚠️ Maximum lift ({fmt3(toDisplay(u.Lmax, 'thrust', sys))} {uThr}) does not exceed the weight — a pull-up (n &gt; 1) is not possible at this speed and Mach number.
        </p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
        <ResultRow label="V = M·a" value={toDisplay(u.V, 'speed', sys).toFixed(2)} unit={uSpd} />
        <ResultRow label="Speed of sound (a)" value={toDisplay(u.a, 'speed', sys).toFixed(2)} unit={uSpd} />
        <ResultRow label="Dynamic pressure (q)" value={qDisp} unit={qUnit} />
        <ResultRow label="Max lift (L_max)" value={fmt3(toDisplay(u.Lmax, 'thrust', sys))} unit={uThr} />
        <ResultRow label="Load factor (n)" value={u.n.toFixed(4)} />
        <ResultRow label="Pull-up radius (R)" value={fmt3(rDisp(u.R))} unit={uRng} />
        <ResultRow label="Turn rate (ω)" value={u.omega.toFixed(5)} unit="rad/s" />
        <ResultRow label="Turn rate (ω)" value={u.omegaDeg.toFixed(3)} unit="°/s" />
      </div>

      {/* Curves at fixed speed: R and ω vs load factor */}
      <div className="grid md:grid-cols-2 gap-4 pt-1">
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            Pull-up radius vs load factor {sys === 'imperial' ? '(ft)' : '(km)'} — dot marks n at CL max
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={u.curve} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
                <CartesianGrid stroke={C.grid} strokeDasharray="3 3" />
                <XAxis
                  dataKey="n"
                  stroke={C.axis}
                  tick={{ fontSize: 10 }}
                  domain={[1.0, 3.0]}
                  tickFormatter={(v: number) => v.toFixed(2)}
                />
                <YAxis
                  stroke={C.axis}
                  tick={{ fontSize: 10 }}
                  tickFormatter={rTick}
                  width={48}
                />
                <Tooltip content={<CurveTooltip />} />
                <Line
                  type="monotone"
                  dataKey="R"
                  name="R"
                  stroke={C.blue}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                {u.canPullUp && u.n <= 3 && (
                  <ReferenceDot x={Number(u.n.toFixed(2))} y={rDisp(u.R)} r={5} fill={C.blue} stroke="none" />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            Turn rate vs load factor (rad/s) — dot marks n at CL max
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={u.curve} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
                <CartesianGrid stroke={C.grid} strokeDasharray="3 3" />
                <XAxis
                  dataKey="n"
                  stroke={C.axis}
                  tick={{ fontSize: 10 }}
                  domain={[1.0, 3.0]}
                  tickFormatter={(v: number) => v.toFixed(2)}
                />
                <YAxis
                  stroke={C.axis}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: number) => v.toFixed(3)}
                  width={48}
                />
                <Tooltip content={<CurveTooltip />} />
                <Line
                  type="monotone"
                  dataKey="omega"
                  name="ω"
                  stroke={C.green}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                {u.canPullUp && u.n <= 3 && (
                  <ReferenceDot x={Number(u.n.toFixed(2))} y={u.omega} r={5} fill={C.green} stroke="none" />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Simplified model at CL max: q = ½ρV² · L_max = q·S·CL_max · n = L_max/W · R = V²/[g₀(n−1)] · ω = g₀(n−1)/V.
        Cd0 and K are not used. The plotted n range (1.05–3.0) is illustrative — not every point is structurally sustainable.
      </p>
    </div>
  );
}
