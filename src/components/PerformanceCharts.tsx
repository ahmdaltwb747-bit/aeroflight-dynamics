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

const fmt = (v: number) => v.toFixed(3);

export function PerformanceCharts({ results, mode }: PerformanceChartsProps) {
  // Chart velocity ranges by engine type
  // Turbofan: 0 to 1200, step 100 | Turboprop & Piston: 0 to 600, step 50
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
      .map(d => ({ V: d.V, PA: Math.max(0, d.PA), PR: d.PR }));
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
    <div className="aviation-card">
      <h3 className="section-title mb-6">Performance Charts (at {results.h_m.toFixed(0)}m / {(results.h_m / 0.3048).toFixed(0)}ft)</h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Thrust vs Velocity */}
        <div className="chart-container">
          <h4 className="text-sm font-semibold text-center text-muted-foreground mb-3">Thrust vs Velocity</h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={thrustData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="V" stroke="#888" fontSize={10} tickFormatter={fmt} domain={[0, vMax]} ticks={xTicks} />
              <YAxis stroke="#888" fontSize={10} tickFormatter={fmt} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <ReferenceLine x={results.Vstall} stroke="#ef4444" strokeDasharray="5 5" label={{ value: `Vs=${fmt(results.Vstall)}`, fill: '#ef4444', fontSize: 9 }} />
              <ReferenceLine x={results.Vmax} stroke="#22c55e" strokeDasharray="5 5" label={{ value: `Vmax=${fmt(results.Vmax)}`, fill: '#22c55e', fontSize: 9 }} />
              <ReferenceLine x={results.VTRmin} stroke={accentColor} strokeDasharray="3 3" label={{ value: `VTRmin`, fill: accentColor, fontSize: 9 }} />
              <Line type="monotone" dataKey="TA" stroke={primaryColor} name="TA" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="TR" stroke={secondaryColor} name="TR" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Power vs Velocity */}
        <div className="chart-container">
          <h4 className="text-sm font-semibold text-center text-muted-foreground mb-3">Power vs Velocity (lb.ft/s)</h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={powerData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="V" stroke="#888" fontSize={10} tickFormatter={fmt} domain={[0, vMax]} ticks={xTicks} />
              <YAxis stroke="#888" fontSize={10} tickFormatter={fmt} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <ReferenceLine x={results.VPRmin} stroke={accentColor} strokeDasharray="5 5" label={{ value: `VPRmin=${fmt(results.VPRmin)}`, fill: accentColor, fontSize: 9 }} />
              <Line type="monotone" dataKey="PA" stroke={primaryColor} name="PA" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="PR" stroke={secondaryColor} name="PR" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Rate of Climb */}
        <div className="chart-container">
          <h4 className="text-sm font-semibold text-center text-muted-foreground mb-3">Rate of Climb (ft/min)</h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={climbData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="V_h" stroke="#888" fontSize={10} tickFormatter={fmt} />
              <YAxis stroke="#888" fontSize={10} tickFormatter={fmt} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="RC" stroke={successColor} name="R/C" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Ceiling Graph */}
        <div className="chart-container">
          <h4 className="text-sm font-semibold text-center text-muted-foreground mb-3">Rate of Climb vs Altitude</h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={ceilingData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="RC" stroke="#888" fontSize={10} tickFormatter={fmt} label={{ value: 'R/C (ft/s)', position: 'insideBottom', offset: -5, fill: '#888', fontSize: 9 }} />
              <YAxis stroke="#888" fontSize={10} tickFormatter={fmt} label={{ value: 'Alt (kft)', angle: -90, position: 'insideLeft', fill: '#888', fontSize: 9 }} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <ReferenceLine y={results.serviceCeiling / 1000} stroke="#3b82f6" strokeDasharray="5 5" label={{ value: `Service: ${(results.serviceCeiling/1000).toFixed(1)}kft`, fill: '#3b82f6', fontSize: 9 }} />
              <ReferenceLine y={results.absoluteCeiling / 1000} stroke="#ef4444" strokeDasharray="5 5" label={{ value: `Absolute: ${(results.absoluteCeiling/1000).toFixed(1)}kft`, fill: '#ef4444', fontSize: 9 }} />
              <Line type="monotone" dataKey="altitude" stroke="#ec4899" name="Altitude" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gliding Hodograph */}
        <div className="chart-container md:col-span-2">
          <h4 className="text-sm font-semibold text-center text-muted-foreground mb-3">Gliding Hodograph (Sink Rate)</h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={glideData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="V_h" stroke="#888" fontSize={10} type="number" domain={['dataMin', 'dataMax']} tickFormatter={fmt} />
              <YAxis stroke="#888" fontSize={10} domain={['dataMin', 0]} tickFormatter={fmt} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="V_v" stroke="#f43f5e" name="V_v (Sink)" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
