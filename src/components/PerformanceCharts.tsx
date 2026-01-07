import { useMemo } from 'react';
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

const primaryColor = '#3b82f6';
const secondaryColor = '#f59e0b';
const successColor = '#10b981';
const accentColor = '#06b6d4';

export function PerformanceCharts({ results, mode }: PerformanceChartsProps) {
  const thrustData = useMemo(() => {
    return results.chartData
      .filter(d => d.V >= 50 && d.V <= 1200)
      .map(d => ({
        V: d.V,
        TA: Math.max(0, d.TA),
        TR: d.TR,
      }));
  }, [results.chartData]);

  const powerData = useMemo(() => {
    return results.chartData
      .filter(d => d.V >= 50 && d.V <= 1200)
      .map(d => ({
        V: d.V,
        PA: Math.max(0, d.PA),
        PR: d.PR,
      }));
  }, [results.chartData]);

  const climbData = useMemo(() => {
    return results.chartData
      .filter(d => d.V >= results.Vstall && d.V <= results.Vmax)
      .map(d => ({
        V_h: d.V_h,
        RC: Math.max(0, d.RC * 60), // Convert to ft/min
      }));
  }, [results]);

  const glideData = useMemo(() => {
    return results.glideData
      .filter(d => d.V >= results.Vstall && d.V <= 1000)
      .map(d => ({
        V_h: d.V_h,
        V_v: d.V_v, // Negative for sink
      }));
  }, [results]);

  return (
    <div className="aviation-card">
      <h3 className="section-title mb-6">Performance Charts</h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Thrust vs Velocity */}
        <div className="chart-container">
          <h4 className="text-sm font-semibold text-center text-muted-foreground mb-3">
            Thrust vs Velocity
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={thrustData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="V" 
                stroke="#888" 
                fontSize={11}
                label={{ value: 'V (ft/s)', position: 'insideBottom', offset: -5, fill: '#888', fontSize: 10 }}
              />
              <YAxis 
                stroke="#888" 
                fontSize={11}
                label={{ value: 'Thrust (lb)', angle: -90, position: 'insideLeft', fill: '#888', fontSize: 10 }}
              />
              <Tooltip 
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <ReferenceLine x={results.Vstall} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Vs', fill: '#ef4444', fontSize: 10 }} />
              <ReferenceLine x={results.Vmax} stroke="#22c55e" strokeDasharray="5 5" label={{ value: 'Vmax', fill: '#22c55e', fontSize: 10 }} />
              <Line type="monotone" dataKey="TA" stroke={primaryColor} name="Thrust Available" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="TR" stroke={secondaryColor} name="Thrust Required" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Power vs Velocity */}
        <div className="chart-container">
          <h4 className="text-sm font-semibold text-center text-muted-foreground mb-3">
            Power vs Velocity
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={powerData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="V" 
                stroke="#888" 
                fontSize={11}
                label={{ value: 'V (ft/s)', position: 'insideBottom', offset: -5, fill: '#888', fontSize: 10 }}
              />
              <YAxis 
                stroke="#888" 
                fontSize={11}
                label={{ value: 'Power (hp)', angle: -90, position: 'insideLeft', fill: '#888', fontSize: 10 }}
              />
              <Tooltip 
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <ReferenceLine x={results.VPRmin} stroke={accentColor} strokeDasharray="5 5" label={{ value: 'V_PRmin', fill: accentColor, fontSize: 10 }} />
              <Line type="monotone" dataKey="PA" stroke={primaryColor} name="Power Available" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="PR" stroke={secondaryColor} name="Power Required" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Rate of Climb */}
        <div className="chart-container">
          <h4 className="text-sm font-semibold text-center text-muted-foreground mb-3">
            Rate of Climb (R/C)
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={climbData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="V_h" 
                stroke="#888" 
                fontSize={11}
                label={{ value: 'V_h (ft/s)', position: 'insideBottom', offset: -5, fill: '#888', fontSize: 10 }}
              />
              <YAxis 
                stroke="#888" 
                fontSize={11}
                label={{ value: 'R/C (ft/min)', angle: -90, position: 'insideLeft', fill: '#888', fontSize: 10 }}
              />
              <Tooltip 
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Line type="monotone" dataKey="RC" stroke={successColor} name="Rate of Climb" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gliding Hodograph */}
        <div className="chart-container">
          <h4 className="text-sm font-semibold text-center text-muted-foreground mb-3">
            Gliding Hodograph (Sink Rate)
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={glideData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="V_h" 
                stroke="#888" 
                fontSize={11}
                type="number"
                domain={['dataMin', 'dataMax']}
                label={{ value: 'V_h (ft/s)', position: 'insideBottom', offset: -5, fill: '#888', fontSize: 10 }}
              />
              <YAxis 
                stroke="#888" 
                fontSize={11}
                domain={['dataMin', 0]}
                label={{ value: 'V_v (ft/s)', angle: -90, position: 'insideLeft', fill: '#888', fontSize: 10 }}
              />
              <Tooltip 
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Line type="monotone" dataKey="V_v" stroke="#f43f5e" name="Sink Rate" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
