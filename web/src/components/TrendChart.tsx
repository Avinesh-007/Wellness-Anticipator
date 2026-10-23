import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

interface TrendChartProps {
  data: Array<{ date: string; value: number }>;
  metricName: string;
  unit: string;
  ewma?: number | null;
  mean?: number | null;
  strokeColor?: string;
  height?: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  metricName,
  unit,
  ewma,
  mean,
  strokeColor = '#059669',
  height = 240,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
        No longitudinal records logged in this timeframe.
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const minVal = Math.max(0, Math.floor(Math.min(...values) * 0.9));
  const maxVal = Math.ceil(Math.max(...values) * 1.1);

  return (
    <div className="w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{metricName}</h4>
          <span className="text-xs text-slate-400">Time-Series & Personal Baseline</span>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          {mean !== undefined && mean !== null && (
            <span className="inline-flex items-center text-slate-600">
              <span className="w-2.5 h-0.5 bg-slate-400 mr-1.5"></span>
              Mean: <strong>{mean}</strong> {unit}
            </span>
          )}
          {ewma !== undefined && ewma !== null && (
            <span className="inline-flex items-center text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
              <span className="w-2.5 h-0.5 bg-emerald-600 mr-1.5"></span>
              EWMA: {ewma} {unit}
            </span>
          )}
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
            <YAxis domain={[minVal, maxVal]} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900 text-white text-xs p-2.5 rounded-lg shadow-lg">
                      <div className="text-slate-400 text-[10px] mb-1">{label}</div>
                      <div className="font-semibold text-emerald-400">
                        {payload[0].value} {unit}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {mean !== undefined && mean !== null && (
              <ReferenceLine y={mean} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'Mean', fill: '#94a3b8', fontSize: 9, position: 'insideTopLeft' }} />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={2.5}
              dot={{ r: 3, fill: strokeColor }}
              activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
