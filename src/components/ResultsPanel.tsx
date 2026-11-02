import { Rocket, Wind, Thermometer, Gauge, Mountain, ArrowDown, TrendingUp } from 'lucide-react';
import { toDisplay, unitOf, powerDisp, powerDispUnit, climbRate, climbRateUnit, glideRange, glideRangeUnit, type UnitSystem } from '@/lib/units';
import type { PerformanceResults } from '@/lib/performanceCalculations';
import type { EngineMode } from './AircraftAnalyzer';

interface ResultsPanelProps {
  results: PerformanceResults;
  mode: EngineMode;
  sys: UnitSystem;
}

interface ResultRowProps {
  label: string;
  value: string;
  unit?: string;
}

function ResultRow({ label, value, unit }: ResultRowProps) {
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

interface ResultSectionProps {
  icon: React.ReactNode;
  title: string;
  color: string;
  children: React.ReactNode;
}

function ResultSection({ icon, title, color, children }: ResultSectionProps) {
  return (
    <div
      className="result-section"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}

export function ResultsPanel({ results, mode: _mode, sys }: ResultsPanelProps) {
  const uSpd = unitOf('speed', sys);
  const uThr = unitOf('thrust', sys);
  const uPwr = powerDispUnit(sys);
  const uRC = climbRateUnit(sys);
  const uAlt = unitOf('altitude', sys);
  const uDen = unitOf('density', sys);
  const uTemp = unitOf('temperature', sys);
  const uCeil = unitOf('ceiling', sys);
  const uRng = unitOf('range', sys);
  // results.h_m is stored in metres
  const hDisp = toDisplay(results.h_m / 0.3048, 'altitude', sys);

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Atmospheric Properties */}
        <ResultSection
          icon={<Thermometer className="w-4 h-4 text-info" />}
          title="Atmospheric Properties"
          color="hsl(199, 89%, 48%)"
        >
          <ResultRow label="Altitude" value={hDisp.toFixed(1)} unit={uAlt} />
          <ResultRow label="Air Density (ρ)" value={toDisplay(results.rho, 'density', sys).toExponential(4)} unit={uDen} />
          <ResultRow label="Temperature" value={toDisplay(results.T, 'temperature', sys).toFixed(2)} unit={uTemp} />
          <ResultRow label="Density Ratio (σ)" value={results.sigma.toFixed(4)} />
          <ResultRow label="Thrust Constant (C)" value={results.C.toFixed(2)} />
        </ResultSection>

        {/* Velocities */}
        <ResultSection
          icon={<Gauge className="w-4 h-4 text-primary" />}
          title="Velocities"
          color="hsl(217, 91%, 60%)"
        >
          <ResultRow label="V_max" value={toDisplay(results.Vmax, 'speed', sys).toFixed(2)} unit={uSpd} />
          <ResultRow label="V_2nd" value={toDisplay(results.V2nd, 'speed', sys).toFixed(2)} unit={uSpd} />
          <ResultRow label="V_stall" value={toDisplay(results.Vstall, 'speed', sys).toFixed(2)} unit={uSpd} />
          <ResultRow label="V_min" value={toDisplay(results.Vmin, 'speed', sys).toFixed(2)} unit={uSpd} />
          <ResultRow label="V_TRmin" value={toDisplay(results.VTRmin, 'speed', sys).toFixed(2)} unit={uSpd} />
          <ResultRow label="V_PRmin" value={toDisplay(results.VPRmin, 'speed', sys).toFixed(2)} unit={uSpd} />
        </ResultSection>

        {/* Climb Performance */}
        <ResultSection
          icon={<TrendingUp className="w-4 h-4 text-success" />}
          title="Climb Performance"
          color="hsl(152, 76%, 45%)"
        >
          <ResultRow label="(R/C)_max" value={toDisplay(results.RCmax, 'speed', sys).toFixed(4)} unit={uSpd} />
          <ResultRow label="V_(R/C)_max" value={toDisplay(results.V_RCmax, 'speed', sys).toFixed(2)} unit={uSpd} />
          <ResultRow label="θ_(R/C)_max" value={results.Theta_RCmax.toFixed(4)} unit="°" />
          <ResultRow label="MEP" value={powerDisp(results.MEP, sys).toFixed(2)} unit={uPwr} />
          {results.stallInRCmax && (
            <p className="text-xs text-warning mt-2">⚠️ Stall occurs in R/C_max region</p>
          )}
        </ResultSection>

        {/* Max Climb Angle */}
        <ResultSection
          icon={<Rocket className="w-4 h-4 text-warning" />}
          title="Max Climb Angle"
          color="hsl(38, 92%, 50%)"
        >
          <ResultRow label="θ_max" value={results.ThetaMax.toFixed(4)} unit="°" />
          <ResultRow label="V_θ_max" value={toDisplay(results.V_ThetaMax, 'speed', sys).toFixed(2)} unit={uSpd} />
          <ResultRow label="(R/C)_θ_max" value={toDisplay(results.RC_ThetaMax, 'speed', sys).toFixed(4)} unit={uSpd} />
          <ResultRow label="MET" value={toDisplay(results.MET, 'thrust', sys).toFixed(2)} unit={uThr} />
          {results.stallInThetaMax && (
            <p className="text-xs text-warning mt-2">⚠️ Stall occurs in θ_max region</p>
          )}
        </ResultSection>
      </div>

      {/* Aerodynamic Relations */}
      <div className="aviation-card">
        <div className="flex items-center gap-2 mb-4">
          <Wind className="w-5 h-5 text-accent" />
          <h3 className="section-title">Aerodynamic Relations</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <ResultRow label="(CL/CD)_max" value={results.CLCD_max.toFixed(4)} />
            <ResultRow label="V at (CL/CD)_max" value={toDisplay(results.V_CLCD_max, 'speed', sys).toFixed(2)} unit={uSpd} />
          </div>
          <div className="space-y-2">
            <ResultRow label="(CL^1.5/CD)_max" value={results.CL_1p5_CD_max.toFixed(4)} />
            <ResultRow label="V at (CL^1.5/CD)_max" value={toDisplay(results.V_CL_1p5_CD_max, 'speed', sys).toFixed(2)} unit={uSpd} />
          </div>
          <div className="space-y-2">
            <ResultRow label="(CL^0.5/CD)_max" value={results.CL_0p5_CD_max.toFixed(4)} />
            <ResultRow label="V at (CL^0.5/CD)_max" value={toDisplay(results.V_CL_0p5_CD_max, 'speed', sys).toFixed(2)} unit={uSpd} />
          </div>
        </div>
      </div>

      {/* Gliding Performance */}
      <div className="aviation-card">
        <div className="flex items-center gap-2 mb-4">
          <ArrowDown className="w-5 h-5 text-destructive" />
          <h3 className="section-title">Gliding Performance</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Minimum Glide Angle</h4>
            <ResultRow label="θ_min (glide)" value={results.Theta_min_glide.toFixed(4)} unit="°" />
            <ResultRow label="V at θ_min" value={toDisplay(results.V_Theta_min_glide, 'speed', sys).toFixed(2)} unit={uSpd} />
            <ResultRow label="(R/D) at θ_min" value={toDisplay(results.RD_Theta_min, 'speed', sys).toFixed(4)} unit={uSpd} />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Minimum Sink Rate</h4>
            <ResultRow label="(R/D)_min" value={toDisplay(results.RD_min, 'speed', sys).toFixed(4)} unit={uSpd} />
            <ResultRow label="V at (R/D)_min" value={toDisplay(results.V_RD_min, 'speed', sys).toFixed(2)} unit={uSpd} />
            <ResultRow label="θ at (R/D)_min" value={results.Theta_RD_min.toFixed(4)} unit="°" />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Glide Range &amp; Endurance</h4>
            <ResultRow label="T_max (glide)" value={String(results.T_max_glide / 60)} unit="min" />
            <ResultRow label="R_max (glide)" value={glideRange(results.R_max_glide, sys).toFixed(3)} unit={glideRangeUnit(sys)} />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Powered Range &amp; Endurance</h4>
            <ResultRow label="R_max" value={toDisplay(results.R_max, 'range', sys).toFixed(3)} unit={uRng} />
            <ResultRow label="V at R_max" value={toDisplay(results.V_Rmax, 'speed', sys).toFixed(2)} unit={uSpd} />
            <ResultRow label="E_max" value={String(results.E_max)} unit="sec" />
            <ResultRow label="V at E_max" value={toDisplay(results.V_Emax, 'speed', sys).toFixed(2)} unit={uSpd} />
          </div>
        </div>
      </div>

      {/* Ceiling Information */}
      <div className="aviation-card">
        <div className="flex items-center gap-2 mb-4">
          <Mountain className="w-5 h-5 text-info" />
          <h3 className="section-title">Ceiling Information</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <ResultRow label="(R/C)_max at SL" value={climbRate(results.RC_max_sl, sys).toFixed(2)} unit={uRC} />
            <ResultRow label="a (intercept)" value={results.a_ceiling.toFixed(4)} />
            <ResultRow label="b (slope)" value={results.b_ceiling.toExponential(4)} />
          </div>
          <div className="space-y-2">
            <ResultRow label="Service Ceiling" value={toDisplay(results.serviceCeiling, 'ceiling', sys).toFixed(2)} unit={uCeil} />
            <ResultRow label="Absolute Ceiling" value={toDisplay(results.absoluteCeiling, 'ceiling', sys).toFixed(2)} unit={uCeil} />
          </div>
        </div>
      </div>
    </div>
  );
}
