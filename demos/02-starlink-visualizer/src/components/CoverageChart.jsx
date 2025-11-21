import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import './CoverageChart.css';

Chart.register(...registerables);

/**
 * CoverageChart Component
 *
 * Visualizes altitude distribution of satellites using Chart.js.
 * Data is derived from TLE-parsed orbital parameters.
 */
function CoverageChart({ satellites }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current || satellites.length === 0) return;

    // Destroy previous chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');

    // Group satellites by altitude ranges
    const altitudeRanges = {
      '500-520 km': 0,
      '520-540 km': 0,
      '540-560 km': 0,
      '560-580 km': 0,
      '580-600 km': 0
    };

    satellites.forEach(sat => {
      if (!sat.position) return;
      const alt = sat.position.altitude;

      if (alt >= 500 && alt < 520) altitudeRanges['500-520 km']++;
      else if (alt >= 520 && alt < 540) altitudeRanges['520-540 km']++;
      else if (alt >= 540 && alt < 560) altitudeRanges['540-560 km']++;
      else if (alt >= 560 && alt < 580) altitudeRanges['560-580 km']++;
      else if (alt >= 580 && alt < 600) altitudeRanges['580-600 km']++;
    });

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(altitudeRanges),
        datasets: [{
          label: 'Satellites',
          data: Object.values(altitudeRanges),
          backgroundColor: 'rgba(0, 212, 255, 0.6)',
          borderColor: '#00d4ff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Altitude Distribution',
            color: '#00d4ff',
            font: {
              size: 14,
              weight: '600'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#8892b0'
            },
            grid: {
              color: 'rgba(0, 212, 255, 0.1)'
            }
          },
          x: {
            ticks: {
              color: '#8892b0'
            },
            grid: {
              color: 'rgba(0, 212, 255, 0.1)'
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [satellites]);

  return (
    <div className="coverage-chart">
      <canvas ref={chartRef}></canvas>
    </div>
  );
}

export default CoverageChart;
