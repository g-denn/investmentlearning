import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Performance } from '../types/api';
import { theme } from '../theme';

interface PerformanceChartProps {
  performance: Performance;
  isShort: boolean;
}

type ChartView = 'bar' | 'line' | 'table';

const PerformanceChart: React.FC<PerformanceChartProps> = ({ performance, isShort }) => {
  const [view, setView] = React.useState<ChartView>('bar');

  const toReturnPct = (ratio: number): number => {
    const pct = (ratio - 1) * 100;
    return isShort ? -pct : pct;
  };

  const formatTimeLabel = (label: string): string => {
    const labelMap: Record<string, string> = {
      '1W': '1 Week',
      '2W': '2 Weeks',
      '1M': '1 Month',
      '3M': '3 Months',
      '6M': '6 Months',
      '1Y': '1 Year',
      '2Y': '2 Years',
      '3Y': '3 Years',
      '5Y': '5 Years',
    };

    return labelMap[label] || label;
  };

  const data = performance.timeline_labels && performance.timeline_values
    ? performance.timeline_labels.map((label, index) => {
        const rawValue = index < performance.timeline_values!.length ? performance.timeline_values![index] : null;
        return {
          name: formatTimeLabel(label),
          value: rawValue != null ? toReturnPct(rawValue) : null,
        };
      })
    : [
        { name: '1 Week', value: performance.oneWeekClosePerf },
        { name: '2 Weeks', value: performance.twoWeekClosePerf },
        { name: '1 Month', value: performance.oneMonthPerf },
        { name: '3 Months', value: performance.threeMonthPerf },
        { name: '6 Months', value: performance.sixMonthPerf },
        { name: '1 Year', value: performance.oneYearPerf },
        { name: '2 Years', value: performance.twoYearPerf },
        { name: '3 Years', value: performance.threeYearPerf },
        { name: '5 Years', value: performance.fiveYearPerf },
      ]
        .filter((item) => item.value != null)
        .map((item) => ({ name: item.name, value: toReturnPct(item.value as number) }));

  const stroke = isShort ? theme.colors.danger : theme.colors.success;

  if (data.length === 0) {
    return (
      <div>
        <h2 style={{ margin: '0 0 0.75rem', fontFamily: theme.fonts.display, fontSize: '1.45rem', letterSpacing: '-0.05em' }}>
          Performance
        </h2>
        <div
          style={{
            padding: '1.25rem',
            borderRadius: 24,
            background: 'rgba(255, 255, 255, 0.72)',
            border: `1px solid ${theme.colors.line}`,
            color: theme.colors.textSoft,
          }}
        >
          No performance data available.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 0.75rem', fontFamily: theme.fonts.display, fontSize: '1.45rem', letterSpacing: '-0.05em' }}>
        Performance
      </h2>
      <div
        style={{
          padding: '1.2rem',
          borderRadius: 28,
          background: 'rgba(255, 255, 255, 0.76)',
          border: `1px solid ${theme.colors.line}`,
          boxShadow: `0 18px 36px ${theme.colors.shadow}`,
        }}
      >
        <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {(['bar', 'line', 'table'] as ChartView[]).map((tab) => {
            const active = tab === view;
            const label = tab === 'bar' ? 'Bar chart' : tab === 'line' ? 'Line chart' : 'Table';
            return (
              <button
                key={tab}
                onClick={() => setView(tab)}
                style={{
                  padding: '0.65rem 0.9rem',
                  borderRadius: theme.radii.pill,
                  border: `1px solid ${active ? theme.colors.text : theme.colors.line}`,
                  background: active ? theme.colors.text : theme.colors.surfaceStrong,
                  color: active ? theme.colors.surfaceStrong : theme.colors.textSoft,
                  fontWeight: active ? 700 : 500,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {view !== 'table' ? (
          <div style={{ width: '100%', height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              {view === 'bar' ? (
                <BarChart data={data} margin={{ top: 8, right: 18, left: 4, bottom: 8 }}>
                  <CartesianGrid stroke={theme.colors.line} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: theme.colors.textSoft, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(value) => `${value.toFixed(0)}%`} tick={{ fill: theme.colors.textSoft, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'Return']}
                    contentStyle={{
                      background: theme.colors.surfaceStrong,
                      border: `1px solid ${theme.colors.line}`,
                      borderRadius: 16,
                      color: theme.colors.text,
                    }}
                  />
                  <Legend />
                  <Bar dataKey="value" name="Return %" fill={stroke} radius={[10, 10, 4, 4]} />
                </BarChart>
              ) : (
                <LineChart data={data} margin={{ top: 8, right: 18, left: 4, bottom: 8 }}>
                  <CartesianGrid stroke={theme.colors.line} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: theme.colors.textSoft, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(value) => `${value.toFixed(0)}%`} tick={{ fill: theme.colors.textSoft, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'Return']}
                    contentStyle={{
                      background: theme.colors.surfaceStrong,
                      border: `1px solid ${theme.colors.line}`,
                      borderRadius: 16,
                      color: theme.colors.text,
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="Return %"
                    stroke={stroke}
                    strokeWidth={3}
                    dot={{ stroke, strokeWidth: 2, r: 4, fill: theme.colors.surfaceStrong }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.7rem' }}>
            {data.map((item) => {
              const value = item.value ?? 0;
              const positive = value > 0;
              return (
                <div
                  key={item.name}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) auto auto',
                    gap: '0.9rem',
                    alignItems: 'center',
                    padding: '0.95rem 1rem',
                    borderRadius: 18,
                    background: theme.colors.surfaceTint,
                  }}
                >
                  <div style={{ color: theme.colors.textSoft }}>{item.name}</div>
                  <div
                    style={{
                      color: positive ? theme.colors.success : theme.colors.danger,
                      fontWeight: 700,
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    }}
                  >
                    {value.toFixed(2)}%
                  </div>
                  <div
                    style={{
                      padding: '0.35rem 0.6rem',
                      borderRadius: theme.radii.pill,
                      background: positive ? '#eefaf7' : '#fff1ef',
                      color: positive ? theme.colors.success : theme.colors.danger,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {positive ? 'Positive' : 'Negative'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceChart;
