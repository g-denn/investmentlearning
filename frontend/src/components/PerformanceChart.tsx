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
import useIsMobile from '../hooks/useIsMobile';
import { Performance } from '../types/api';
import { theme } from '../theme';

interface PerformanceChartProps {
  performance: Performance;
  isShort: boolean;
  startDate?: string;
  title?: string;
  subtitle?: string;
}

type ChartView = 'bar' | 'line' | 'table';
type TimelinePoint = {
  name: string;
  value: number | null;
  milestone: string;
  dateLabel?: string;
  detailDate?: string;
};

const milestoneRows = [
  { key: 'oneWeekClosePerf', shortLabel: '1W', label: '1 Week', monthsToAdd: 0, daysToAdd: 7 },
  { key: 'twoWeekClosePerf', shortLabel: '2W', label: '2 Weeks', monthsToAdd: 0, daysToAdd: 14 },
  { key: 'oneMonthPerf', shortLabel: '1M', label: '1 Month', monthsToAdd: 1, daysToAdd: 0 },
  { key: 'threeMonthPerf', shortLabel: '3M', label: '3 Months', monthsToAdd: 3, daysToAdd: 0 },
  { key: 'sixMonthPerf', shortLabel: '6M', label: '6 Months', monthsToAdd: 6, daysToAdd: 0 },
  { key: 'oneYearPerf', shortLabel: '1Y', label: '1 Year', monthsToAdd: 12, daysToAdd: 0 },
  { key: 'twoYearPerf', shortLabel: '2Y', label: '2 Years', monthsToAdd: 24, daysToAdd: 0 },
  { key: 'threeYearPerf', shortLabel: '3Y', label: '3 Years', monthsToAdd: 36, daysToAdd: 0 },
  { key: 'fiveYearPerf', shortLabel: '5Y', label: '5 Years', monthsToAdd: 60, daysToAdd: 0 },
] as const;

const shortLabelMap = milestoneRows.reduce<Record<string, string>>((acc, item) => {
  acc[item.shortLabel] = item.label;
  return acc;
}, {});

const addPeriodToDate = (startDate: Date, monthsToAdd: number, daysToAdd: number): Date => {
  const next = new Date(startDate);
  if (monthsToAdd > 0) {
    next.setMonth(next.getMonth() + monthsToAdd);
  }
  if (daysToAdd > 0) {
    next.setDate(next.getDate() + daysToAdd);
  }
  return next;
};

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  performance,
  startDate,
  title = 'Performance',
  subtitle,
}) => {
  const isMobile = useIsMobile();
  const [view, setView] = React.useState<ChartView>('line');

  const toReturnPct = (ratio: number): number => (ratio - 1) * 100;

  const formatTimeLabel = (label: string): string => {
    return shortLabelMap[label] || label;
  };

  const data = React.useMemo<TimelinePoint[]>(() => {
    const parsedStartDate = startDate ? new Date(startDate) : null;
    const hasValidStartDate = parsedStartDate != null && !Number.isNaN(parsedStartDate.getTime());

    const basePoints = milestoneRows
      .map((item) => ({
        label: item.label,
        shortLabel: item.shortLabel,
        rawValue: performance[item.key],
        monthsToAdd: item.monthsToAdd,
        daysToAdd: item.daysToAdd,
      }))
      .filter((item) => item.rawValue != null);

    if (hasValidStartDate) {
      const start = parsedStartDate as Date;
      const startingPoint: TimelinePoint = {
        name: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        value: 0,
        milestone: 'Start',
        dateLabel: start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        detailDate: start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      };

      return [
        startingPoint,
        ...basePoints.map((item) => {
          const markerDate = addPeriodToDate(start, item.monthsToAdd, item.daysToAdd);
          return {
            name: markerDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            value: toReturnPct(item.rawValue as number),
            milestone: item.label,
            dateLabel: markerDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            detailDate: markerDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          };
        }),
      ];
    }

    if (performance.timeline_labels && performance.timeline_values) {
      return performance.timeline_labels.map((label, index) => {
        const rawValue = index < performance.timeline_values!.length ? performance.timeline_values![index] : null;
        return {
          name: formatTimeLabel(label),
          milestone: formatTimeLabel(label),
          value: rawValue != null ? toReturnPct(rawValue) : null,
        };
      });
    }

    return basePoints.map((item) => ({
      name: item.label,
      milestone: item.label,
      value: toReturnPct(item.rawValue as number),
    }));
  }, [formatTimeLabel, performance, startDate]);

  const lastValue = [...data].reverse().find((point) => point.value != null)?.value ?? 0;
  const stroke = lastValue >= 0 ? theme.colors.success : theme.colors.danger;
  const chartSubtitle = subtitle ?? (startDate ? 'Anchored to the thesis publish date with milestone markers through 5 years.' : '');
  const xAxisKey = startDate ? 'dateLabel' : 'name';

  if (data.length === 0) {
    return (
      <div>
        <h2 style={{ margin: '0 0 0.75rem', fontFamily: theme.fonts.display, fontSize: '1.45rem', letterSpacing: '-0.05em' }}>
          {title}
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
        {title}
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
        {chartSubtitle && (
          <p style={{ margin: '0 0 1rem', color: theme.colors.textSoft, lineHeight: 1.6 }}>
            {chartSubtitle}
          </p>
        )}

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
          <div style={{ width: '100%', height: isMobile ? 300 : 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              {view === 'bar' ? (
                <BarChart data={data} margin={{ top: 8, right: 18, left: 4, bottom: 8 }}>
                  <CartesianGrid stroke={theme.colors.line} vertical={false} />
                  <XAxis dataKey={xAxisKey} tick={{ fill: theme.colors.textSoft, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(value) => `${value.toFixed(0)}%`} tick={{ fill: theme.colors.textSoft, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'Return']}
                    labelFormatter={(_, payload) => {
                      const point = payload?.[0]?.payload as TimelinePoint | undefined;
                      return point?.detailDate ? `${point.milestone} - ${point.detailDate}` : point?.milestone ?? '';
                    }}
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
                  <XAxis dataKey={xAxisKey} tick={{ fill: theme.colors.textSoft, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(value) => `${value.toFixed(0)}%`} tick={{ fill: theme.colors.textSoft, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'Return']}
                    labelFormatter={(_, payload) => {
                      const point = payload?.[0]?.payload as TimelinePoint | undefined;
                      return point?.detailDate ? `${point.milestone} - ${point.detailDate}` : point?.milestone ?? '';
                    }}
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
                    dot={{ stroke, strokeWidth: 2, r: 5, fill: theme.colors.surfaceStrong }}
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
                  key={`${item.milestone}-${item.name}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) auto auto',
                    gap: isMobile ? '0.55rem' : '0.9rem',
                    alignItems: 'center',
                    padding: '0.95rem 1rem',
                    borderRadius: 18,
                    background: theme.colors.surfaceTint,
                  }}
                >
                  <div>
                    <div style={{ color: theme.colors.textSoft }}>{item.milestone}</div>
                    {item.detailDate && (
                      <div style={{ color: theme.colors.textMuted, fontSize: '0.78rem', marginTop: '0.2rem' }}>
                        {item.detailDate}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      color: positive ? theme.colors.success : theme.colors.danger,
                      fontWeight: 700,
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      textAlign: isMobile ? 'left' : 'right',
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
