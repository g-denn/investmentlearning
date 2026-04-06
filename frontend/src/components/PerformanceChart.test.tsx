import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PerformanceChart from './PerformanceChart';

const samplePerformance = {
  nextDayOpen: 1,
  nextDayClose: 1.02,
  oneWeekClosePerf: 1.05,
  twoWeekClosePerf: 1.08,
  oneMonthPerf: 1.12,
  threeMonthPerf: 1.18,
  sixMonthPerf: 1.25,
  oneYearPerf: 1.4,
  twoYearPerf: 1.55,
  threeYearPerf: 1.7,
  fiveYearPerf: 2.1,
};

describe('PerformanceChart', () => {
  it('anchors the timeline to the thesis publish date and exposes dated milestone markers', async () => {
    const user = userEvent.setup();

    render(
      <PerformanceChart
        performance={samplePerformance}
        isShort={false}
        startDate="2024-01-01T00:00:00Z"
      />,
    );

    expect(screen.getByText('Anchored to the thesis publish date with milestone markers through 5 years.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Table' }));

    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.getByText('January 1, 2024')).toBeInTheDocument();
    expect(screen.getByText('1 Week')).toBeInTheDocument();
    expect(screen.getByText('January 8, 2024')).toBeInTheDocument();
    expect(screen.getByText('5 Years')).toBeInTheDocument();
    expect(screen.getByText('January 1, 2029')).toBeInTheDocument();
  });
});
