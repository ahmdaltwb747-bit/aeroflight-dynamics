import { Rocket, Wind, Thermometer, Gauge, Mountain, ArrowDown, TrendingUp } from 'lucide-react';
import type { PerformanceResults } from '@/lib/performanceCalculations';
import type { EngineMode } from './AircraftAnalyzer';

interface ResultsPanelProps {
  results: PerformanceResults;
  mode: EngineMode;
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
      className="p-4 rounded-lg border-l-4"
      style={{ 
        background: 'linear-gradient(145deg, hsl(220, 14%, 18%) 0%, hsl(220, 14%, 14%) 100%)',
        borderLeftColor: color 
      }}
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

export function ResultsPanel({ results, mode }: ResultsPanelProps) {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Atmospheric Properties */}
        <ResultSection
          icon={<Thermometer className="w-4 h-4 text-info" />}
          title="Atmospheric Properties"
          color="hsl(199, 89%, 48%)"
        >
          <ResultRow label="Altitude" value={results.h_m.toFixed(1)} unit="m" />
          <ResultRow label="Air Density (ρ)" value={results.rho.toExponential(4)} unit="slug/ft³" />
          <ResultRow label="Temperature" value={results.T.toFixed(2)} unit="°R" />
          <ResultRow label="Density Ratio (σ)" value={results.sigma.toFixed(4)} />
          <ResultRow label="Thrust Constant (C)" value={results.C.toFixed(2)} />
        </ResultSection>

        {/* Velocities */}
        <ResultSection
          icon={<Gauge className="w-4 h-4 text-primary" />}
          title="Velocities"
          color="hsl(217, 91%, 60%)"
        >
          <ResultRow label="V_max" value={results.Vmax.toFixed(2)} unit="ft/s" />
          <ResultRow label="V_2nd" value={results.V2nd.toFixed(2)} unit="ft/s" />
          <ResultRow label="V_stall" value={results.Vstall.toFixed(2)} unit="ft/s" />
          <ResultRow label="V_min" value={results.Vmin.toFixed(2)} unit="ft/s" />
          <ResultRow label="V_TRmin" value={results.VTRmin.toFixed(2)} unit="ft/s" />
          <ResultRow label="V_PRmin" value={results.VPRmin.toFixed(2)} unit="ft/s" />
        </ResultSection>

        {/* Climb Performance */}
        <ResultSection
          icon={<TrendingUp className="w-4 h-4 text-success" />}
          title="Climb Performance"
          color="hsl(152, 76%, 45%)"
        >
          <ResultRow label="(R/C)_max" value={results.RCmax.toFixed(4)} unit="ft/s" />
          <ResultRow label="V_(R/C)_max" value={results.V_RCmax.toFixed(2)} unit="ft/s" />
          <ResultRow label="θ_(R/C)_max" value={results.Theta_RCmax.toFixed(4)} unit="°" />
          <ResultRow label="MEP" value={results.MEP.toFixed(2)} unit="hp" />
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
          <ResultRow label="V_θ_max" value={results.V_ThetaMax.toFixed(2)} unit="ft/s" />
          <ResultRow label="(R/C)_θ_max" value={results.RC_ThetaMax.toFixed(4)} unit="ft/s" />
          <ResultRow label="MET" value={results.MET.toFixed(2)} unit="lb" />
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
            <ResultRow label="V at (CL/CD)_max" value={results.V_CLCD_max.toFixed(2)} unit="ft/s" />
          </div>
          <div className="space-y-2">
            <ResultRow label="(CL^1.5/CD)_max" value={results.CL_1p5_CD_max.toFixed(4)} />
            <ResultRow label="V at (CL^1.5/CD)_max" value={results.V_CL_1p5_CD_max.toFixed(2)} unit="ft/s" />
          </div>
          <div className="space-y-2">
            <ResultRow label="(CL^0.5/CD)_max" value={results.CL_0p5_CD_max.toFixed(4)} />
            <ResultRow label="V at (CL^0.5/CD)_max" value={results.V_CL_0p5_CD_max.toFixed(2)} unit="ft/s" />
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
            <ResultRow label="V at θ_min" value={results.V_Theta_min_glide.toFixed(2)} unit="ft/s" />
            <ResultRow label="(R/D) at θ_min" value={results.RD_Theta_min.toFixed(4)} unit="ft/s" />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Minimum Sink Rate</h4>
            <ResultRow label="(R/D)_min" value={results.RD_min.toFixed(4)} unit="ft/s" />
            <ResultRow label="V at (R/D)_min" value={results.V_RD_min.toFixed(2)} unit="ft/s" />
            <ResultRow label="θ at (R/D)_min" value={results.Theta_RD_min.toFixed(4)} unit="°" />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Glide Range & Endurance</h4>
            <ResultRow label="T_max (glide)" value={String(results.T_max_glide / 60)} unit="min" />
            <ResultRow label="R_max (glide)" value={String(results.R_max_glide / 5280)} unit="miles" />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Powered Range & Endurance</h4>
            <ResultRow label="R_max" value={String(results.R_max)} unit="ft" />
            <ResultRow label="V at R_max" value={String(results.V_Rmax)} unit="ft/s" />
            <ResultRow label="E_max" value={String(results.E_max)} unit="sec" />
            <ResultRow label="V at E_max" value={String(results.V_Emax)} unit="ft/s" />
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
            <ResultRow label="(R/C)_max at SL" value={(results.RC_max_sl * 60).toFixed(2)} unit="ft/min" />
            <ResultRow label="a (intercept)" value={results.a_ceiling.toFixed(4)} />
            <ResultRow label="b (slope)" value={results.b_ceiling.toExponential(4)} />
          </div>
          <div className="space-y-2">
            <ResultRow label="Service Ceiling" value={(results.serviceCeiling / 1000).toFixed(2)} unit="kft" />
            <ResultRow label="Absolute Ceiling" value={(results.absoluteCeiling / 1000).toFixed(2)} unit="kft" />
          </div>
        </div>
      </div>
    </div>
  );
}
