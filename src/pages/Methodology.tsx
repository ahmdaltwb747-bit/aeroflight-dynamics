import { Link } from 'react-router-dom';
import { BookOpen, ArrowLeft, Thermometer, Wind, Gauge, TrendingUp, ArrowDown, Mountain, Compass, FileText } from 'lucide-react';

const Formula = ({ children }: { children: React.ReactNode }) => (
  <p className="font-mono text-xs sm:text-sm bg-muted/50 border border-border rounded px-3 py-2 overflow-x-auto text-foreground whitespace-nowrap">
    {children}
  </p>
);

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="aviation-card space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="section-title">{title}</h2>
      </div>
      <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}

export default function Methodology() {
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="aviation-card animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground glow-text">Methodology</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Equations, assumptions and references behind every result in the analyzer.
                </p>
              </div>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Analyzer
            </Link>
          </div>
        </header>

        <Section icon={<Gauge className="w-4 h-4 text-primary" />} title="Scope & Conventions">
          <p>
            All calculations are performed internally in British (Imperial) units — lb, ft, ft/s, slug/ft³, °R, hp —
            matching the source MATLAB model. The Imperial / SI toggle converts values only at the display and input
            boundary; it never changes the underlying physics.
          </p>
          <p>Three engine models are available: <strong className="text-foreground">Turbofan (jet)</strong>,{' '}
            <strong className="text-foreground">Turboprop</strong> and <strong className="text-foreground">Piston</strong>.
            Turbofan thrust assumes 2 engines (static thrust input is per engine).</p>
        </Section>

        <Section icon={<Thermometer className="w-4 h-4 text-info" />} title="ISA Atmosphere Model">
          <p>Standard atmosphere, British units (troposphere below 11 km / 36,089 ft):</p>
          <Formula>T = 518.67 − 0.003566 · h&nbsp;&nbsp;[°R, h in ft]</Formula>
          <Formula>ρ = ρ₀ · (T / T₀)^4.2561</Formula>
          <p>Stratosphere (isothermal):</p>
          <Formula>T = 389.97 °R&nbsp;&nbsp;·&nbsp;&nbsp;ρ = 0.0007061 · e^(−(h − 36089) / 20806)</Formula>
          <p>Density ratio and constants:</p>
          <Formula>σ = ρ / ρ₀&nbsp;&nbsp;·&nbsp;&nbsp;g₀ = 32.174 ft/s²&nbsp;&nbsp;·&nbsp;&nbsp;R = 1716 ft·lbf/(slug·°R)&nbsp;&nbsp;·&nbsp;&nbsp;γ = 1.4&nbsp;&nbsp;·&nbsp;&nbsp;ρ₀ = 0.002377 slug/ft³</Formula>
        </Section>

        <Section icon={<Wind className="w-4 h-4 text-primary" />} title="Aerodynamics — Drag Polar">
          <p>Parabolic drag polar with constant Oswald efficiency factor:</p>
          <Formula>CD = Cd0 + K · CL²&nbsp;&nbsp;·&nbsp;&nbsp;K = 1 / (π · e · AR)</Formula>
          <Formula>q = ½ · ρ · V²&nbsp;&nbsp;·&nbsp;&nbsp;CL = W / (q · S)&nbsp;&nbsp;·&nbsp;&nbsp;TR = q · S · CD</Formula>
        </Section>

        <Section icon={<ZapLike />} title="Engine Models — Thrust & Power Available">
          <p><strong className="text-foreground">Turbofan:</strong> thrust decays with velocity and altitude:</p>
          <Formula>TA = C · V^(−n)&nbsp;&nbsp;·&nbsp;&nbsp;C = 2 · Tv0 · A · a^n · σ^m&nbsp;&nbsp;·&nbsp;&nbsp;a = √(γ · R · T)</Formula>
          <p><strong className="text-foreground">Turboprop:</strong> power available is constant with speed and decays with altitude:</p>
          <Formula>PA = Ne · Psh · (η + jetRatio) · σ^m&nbsp;&nbsp;·&nbsp;&nbsp;TA = PA / V</Formula>
          <p><strong className="text-foreground">Piston:</strong> brake power scales linearly with density ratio:</p>
          <Formula>Pb = P0 · σ&nbsp;&nbsp;·&nbsp;&nbsp;PA = Pb · η&nbsp;&nbsp;·&nbsp;&nbsp;TA = PA / V</Formula>
        </Section>

        <Section icon={<Gauge className="w-4 h-4 text-warning" />} title="Key Velocities">
          <Formula>Vs = √( 2·W / (ρ · S · CLmax) )</Formula>
          <Formula>V(TR min) = √( (2/ρ) · (W/S) · √(K/Cd0) )</Formula>
          <Formula>V(PR min) = √( (2/ρ) · (W/S) · √(K / (3·Cd0)) )</Formula>
          <p>Vmax and the second solution V₂ are found where TA = TR using a numerical (bisection) solver; Vmin = max(Vs, V₂).</p>
        </Section>

        <Section icon={<TrendingUp className="w-4 h-4 text-success" />} title="Climb Performance">
          <Formula>R/C = (PA − PR) / W = (TA − TR) · V / W&nbsp;&nbsp;·&nbsp;&nbsp;θ = asin( (TA − TR) / W )</Formula>
          <p>Maximum rate of climb (MEP) and maximum climb angle (MET) are read from the excess-power / excess-thrust
            curves between stall and maximum speed. If the maximum falls below stall speed, the value at V = Vs is used and a
            stall warning is raised.</p>
        </Section>

        <Section icon={<ArrowDown className="w-4 h-4 text-destructive" />} title="Gliding Performance (Thrust = 0)">
          <Formula>θ = asin( −TR / W )&nbsp;&nbsp;·&nbsp;&nbsp;R/D = −V·sin(θ)&nbsp;&nbsp;·&nbsp;&nbsp;V_h = V·cos(θ)</Formula>
          <p>Best glide occurs at (CL/CD)max, minimum sink rate at (CL^1.5/CD)max. Glide range and endurance from altitude h:</p>
          <Formula>R_max glide = h / tan(|θ_min|)&nbsp;&nbsp;·&nbsp;&nbsp;T_max glide = h / (R/D)min</Formula>
        </Section>

        <Section icon={<Mountain className="w-4 h-4 text-info" />} title="Aerodynamic Ratios & Ceilings">
          <Formula>(CL/CD)max = 1 / √(4·K·Cd0)&nbsp;&nbsp;·&nbsp;&nbsp;(CL^1.5/CD)max = 0.25 · (3 / (K · Cd0^(1/3)))^0.75</Formula>
          <Formula>(CL^0.5/CD)max = 0.75 · ( 1 / (3·K·Cd0³) )^0.25</Formula>
          <p>The maximum rate of climb is fitted linearly against altitude, R/C = a + b·h. The absolute ceiling is where
            R/C = 0; the service ceiling is where R/C = 100 ft/min.</p>
        </Section>

        <Section icon={<Compass className="w-4 h-4 text-success" />} title="Range & Endurance (Breguet-type laws)">
          <p>With W₁ = W₀ − Wf and fuel consumption converted to per-second (Ct or c / 3600):</p>
          <p><strong className="text-foreground">Jet (turbofan):</strong></p>
          <Formula>R_max = (2/Ct) · √( 2/(ρ·S) ) · (CL^0.5/CD)max · (√W₀ − √W₁)</Formula>
          <Formula>E_max = (1/Ct) · (CL/CD)max · ln(W₀ / W₁)</Formula>
          <p><strong className="text-foreground">Propeller (turboprop & piston):</strong></p>
          <Formula>R_max = (η/c) · (CL/CD)max · ln(W₀ / W₁)</Formula>
          <Formula>E_max = (η/c) · √(2·ρ·S) · (CL^1.5/CD)max · (W₁^(−0.5) − W₀^(−0.5))</Formula>
        </Section>

        <Section icon={<FileText className="w-4 h-4 text-muted-foreground" />} title="Assumptions">
          <ul className="list-disc pl-5 space-y-1">
            <li>ISA standard atmosphere, no wind, no compressibility or wave-drag corrections.</li>
            <li>Parabolic drag polar with constant Cd0 and K (constant Oswald efficiency).</li>
            <li>Quasi-steady flight; weight is constant during the performance sweep (W/S fixed).</li>
            <li>Turbofan static thrust input is per engine; the model uses 2 engines total.</li>
            <li>Specific fuel consumption treated as constant within the cruise segment.</li>
            <li>Chart and table velocity ranges follow the source MATLAB model: turbofan 0–1200 ft/s (tables 100–1200,
              step 100); turboprop & piston 0–600 ft/s (tables 50–600, step 50).</li>
          </ul>
        </Section>

        <Section icon={<FileText className="w-4 h-4 text-muted-foreground" />} title="References">
          <ul className="list-disc pl-5 space-y-1">
            <li>Anderson, J. D., <em>Aircraft Performance and Design</em>, McGraw-Hill.</li>
            <li>Raymer, D. P., <em>Aircraft Design: A Conceptual Approach</em>, AIAA.</li>
            <li>Course notes: <em>Analytical Laws of R/D</em>, <em>Range & Endurance Laws</em>, <em>Rate of Climb — Analytical Method</em>.</li>
            <li>Reference MATLAB implementation supplied with the course material (turbofan, turboprop, piston models).</li>
          </ul>
        </Section>

        <footer className="text-center text-xs text-muted-foreground pt-6 border-t border-border">
          Aircraft Performance Analyzer · Methodology · For educational purposes only — verify all results before operational use.
        </footer>
      </div>
    </div>
  );
}

function ZapLike() {
  return <ZapIcon />;
}

import { Zap } from 'lucide-react';
function ZapIcon() {
  return <Zap className="w-4 h-4 text-turboprop" />;
}
