import { Gauge, Wind, TrendingUp, Compass } from 'lucide-react';
import type { PerformanceResults } from '@/lib/performanceCalculations';
import type { EngineMode } from './AircraftAnalyzer';

interface MetricsCardsProps {
  results: PerformanceResults;
  mode: EngineMode;
}

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  unit: string;
  color: string;
  delay: number;
}

function MetricCard({ icon, title, value, unit, color, delay }: MetricCardProps) {
  return (
    <div 
      className="metric-card animate-fade-in"
      style={{ 
        borderLeftColor: color,
        animationDelay: `${delay * 0.1}s`
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

export function MetricsCards({ results, mode }: MetricsCardsProps) {
  const primaryColor = mode === 'turbofan' ? 'hsl(217, 91%, 60%)' : 'hsl(152, 76%, 45%)';
  
  const metrics = [
    {
      icon: <Gauge className="w-4 h-4 text-primary" />,
      title: "Max Speed (Vmax)",
      value: (results.Vmax * 0.592484).toFixed(0),
      unit: "knots",
      color: primaryColor,
    },
    {
      icon: <Wind className="w-4 h-4 text-warning" />,
      title: "Stall Speed (Vs)",
      value: (results.Vstall * 0.592484).toFixed(0),
      unit: "knots",
      color: "hsl(38, 92%, 50%)",
    },
    {
      icon: <TrendingUp className="w-4 h-4 text-success" />,
      title: "Max Rate of Climb",
      value: (results.RCmax * 60).toFixed(0),
      unit: "ft/min",
      color: "hsl(152, 76%, 45%)",
    },
    {
      icon: <Compass className="w-4 h-4 text-info" />,
      title: "Max Glide Ratio",
      value: results.CLCD_max.toFixed(2),
      unit: "L/D",
      color: "hsl(199, 89%, 48%)",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <MetricCard
          key={metric.title}
          {...metric}
          delay={index}
        />
      ))}
    </div>
  );
}
