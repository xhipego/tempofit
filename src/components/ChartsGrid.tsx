import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Chart,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  DoughnutController,
  PieController,
  BarController,
} from 'chart.js';
import { SiavongaParticipant } from '../types/dashboard';

Chart.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  DoughnutController,
  PieController,
  BarController
);

interface ChartsGridProps {
  participants: SiavongaParticipant[];
  onPackageClick?: (packageName: string) => void;
  onTownClick?: (town: string) => void;
  onPaymentStatusClick?: (status: string) => void;
}

export const ChartsGrid: React.FC<ChartsGridProps> = ({
  participants,
  onPackageClick,
  onTownClick,
  onPaymentStatusClick,
}) => {
  // Metric toggle for demographic chart: by participants count vs by total revenue in Kwacha
  const [demographicMetric, setDemographicMetric] = useState<'count' | 'revenue'>('count');
  // Metric toggle for package chart: by count vs revenue
  const [packageMetric, setPackageMetric] = useState<'count' | 'revenue'>('count');

  const packageChartRef = useRef<HTMLCanvasElement | null>(null);
  const demographicChartRef = useRef<HTMLCanvasElement | null>(null);
  const financialChartRef = useRef<HTMLCanvasElement | null>(null);

  const packageChartInstance = useRef<Chart | null>(null);
  const demographicChartInstance = useRef<Chart | null>(null);
  const financialChartInstance = useRef<Chart | null>(null);

  // Compute metrics for tooltips and center labels
  const dataStats = useMemo(() => {
    let freeCount = 0;
    let k150Count = 0;
    let k400Count = 0;

    let freeRev = 0;
    let k150Rev = 0;
    let k400Rev = 0;

    let approvedRev = 0;
    let pendingRev = 0;
    let rejectedRev = 0;

    let approvedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;

    const towns: { [key: string]: { count: number; revenue: number } } = {};

    participants.forEach((p) => {
      const cat = p.categoryPackage.toLowerCase();
      const amt = p.amountPaid || 0;
      const status = (p.paymentVerificationStatus || '').toLowerCase();

      // Package calc
      if (cat.includes('free') || cat.includes('member')) {
        freeCount++;
        freeRev += amt;
      } else if (cat.includes('150')) {
        k150Count++;
        k150Rev += amt;
      } else {
        k400Count++;
        k400Rev += amt;
      }

      // Payment status calc
      if (status === 'approved') {
        approvedCount++;
        approvedRev += amt;
      } else if (status === 'rejected') {
        rejectedCount++;
        rejectedRev += amt;
      } else {
        pendingCount++;
        pendingRev += amt;
      }

      // Town calc
      const town = p.townCity ? p.townCity.trim() : 'Other';
      if (!towns[town]) {
        towns[town] = { count: 0, revenue: 0 };
      }
      towns[town].count++;
      if (status === 'approved') {
        towns[town].revenue += amt;
      }
    });

    return {
      freeCount,
      k150Count,
      k400Count,
      freeRev,
      k150Rev,
      k400Rev,
      approvedCount,
      pendingCount,
      rejectedCount,
      approvedRev,
      pendingRev,
      rejectedRev,
      towns,
    };
  }, [participants]);

  // 1. Modern Doughnut Chart (Package Distribution with Dynamic Center Stat)
  useEffect(() => {
    if (!packageChartRef.current) return;
    if (packageChartInstance.current) {
      packageChartInstance.current.destroy();
    }

    const ctx = packageChartRef.current.getContext('2d');
    if (!ctx) return;

    const isRev = packageMetric === 'revenue';
    const chartData = isRev
      ? [dataStats.freeRev, dataStats.k150Rev, dataStats.k400Rev]
      : [dataStats.freeCount, dataStats.k150Count, dataStats.k400Count];

    const totalVal = chartData.reduce((a, b) => a + b, 0);

    packageChartInstance.current = new Chart(packageChartRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Free Member', 'K150 Run Only', 'K400 Run + Mini DripKit'],
        datasets: [
          {
            data: chartData,
            backgroundColor: ['#10b981', '#0ea5e9', '#ec4899'],
            hoverBackgroundColor: ['#34d399', '#38bdf8', '#f472b6'],
            borderColor: '#0b1120',
            borderWidth: 4,
            hoverOffset: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '76%',
        animation: {
          animateScale: true,
          animateRotate: true,
          duration: 700,
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#94a3b8',
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: 500 },
              boxWidth: 10,
              boxHeight: 10,
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 14,
            },
          },
          tooltip: {
            backgroundColor: '#090d16',
            titleColor: '#ffffff',
            bodyColor: '#e2e8f0',
            borderColor: '#1e293b',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const val = context.raw as number;
                const pct = totalVal > 0 ? ((val / totalVal) * 100).toFixed(1) : '0';
                if (isRev) {
                  return ` Revenue: K${val.toLocaleString()} (${pct}%)`;
                }
                return ` Runners: ${val} (${pct}%)`;
              },
            },
          },
        },
        onClick: (_, elements) => {
          if (elements.length > 0 && onPackageClick) {
            const idx = elements[0].index;
            const fullLabels = [
              'Free - Member Participation',
              'K150 - Run Only',
              'K400 - Run + Mini DripKit',
            ];
            onPackageClick(fullLabels[idx]);
          }
        },
      },
    });

    return () => {
      if (packageChartInstance.current) packageChartInstance.current.destroy();
    };
  }, [dataStats, packageMetric, onPackageClick]);

  // 2. Modern Bar Chart (Demographic Origin with Gradients & Metric Toggle)
  useEffect(() => {
    if (!demographicChartRef.current) return;
    if (demographicChartInstance.current) {
      demographicChartInstance.current.destroy();
    }

    const ctx = demographicChartRef.current.getContext('2d');
    if (!ctx) return;

    // Create vibrant vertical linear gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, '#ec4899');
    gradient.addColorStop(1, '#db2777');

    const sortedTowns = Object.entries(dataStats.towns)
      .sort((a, b) => {
        return demographicMetric === 'revenue'
          ? b[1].revenue - a[1].revenue
          : b[1].count - a[1].count;
      })
      .slice(0, 6);

    const labels = sortedTowns.map((t) => t[0]);
    const values = sortedTowns.map((t) =>
      demographicMetric === 'revenue' ? t[1].revenue : t[1].count
    );

    demographicChartInstance.current = new Chart(demographicChartRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: demographicMetric === 'revenue' ? 'Revenue (K)' : 'Participants',
            data: values,
            backgroundColor: gradient,
            hoverBackgroundColor: '#f472b6',
            borderRadius: 8,
            borderSkipped: false,
            maxBarThickness: 32,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 700,
          easing: 'easeOutQuart',
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#090d16',
            titleColor: '#ffffff',
            bodyColor: '#e2e8f0',
            borderColor: '#1e293b',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const val = context.parsed.y ?? 0;
                return demographicMetric === 'revenue'
                  ? ` Collected: K${val.toLocaleString()}`
                  : ` Runners: ${val} registered`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#94a3b8',
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: 500 },
            },
          },
          y: {
            grid: { color: 'rgba(51, 65, 85, 0.3)' },
            ticks: {
              color: '#94a3b8',
              font: { family: "'JetBrains Mono', monospace", size: 10 },
              callback: (val) =>
                val !== null && val !== undefined
                  ? demographicMetric === 'revenue'
                    ? `K${val}`
                    : `${val}`
                  : '',
            },
            beginAtZero: true,
          },
        },
        onClick: (_, elements) => {
          if (elements.length > 0 && onTownClick) {
            const idx = elements[0].index;
            onTownClick(labels[idx]);
          }
        },
      },
    });

    return () => {
      if (demographicChartInstance.current) demographicChartInstance.current.destroy();
    };
  }, [dataStats, demographicMetric, onTownClick]);

  // 3. Modern Financial Approval Funnel (Pie/Doughnut with High-Contrast Segments)
  useEffect(() => {
    if (!financialChartRef.current) return;
    if (financialChartInstance.current) {
      financialChartInstance.current.destroy();
    }

    const totalFunnel =
      dataStats.approvedCount + dataStats.pendingCount + dataStats.rejectedCount;

    financialChartInstance.current = new Chart(financialChartRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Approved', 'Pending Verification', 'Rejected'],
        datasets: [
          {
            data: [dataStats.approvedCount, dataStats.pendingCount, dataStats.rejectedCount],
            backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'],
            hoverBackgroundColor: ['#34d399', '#fbbf24', '#fb7185'],
            borderColor: '#0b1120',
            borderWidth: 4,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        animation: {
          animateScale: true,
          animateRotate: true,
          duration: 700,
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#94a3b8',
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: 500 },
              boxWidth: 10,
              boxHeight: 10,
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 14,
            },
          },
          tooltip: {
            backgroundColor: '#090d16',
            titleColor: '#ffffff',
            bodyColor: '#e2e8f0',
            borderColor: '#1e293b',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const count = context.raw as number;
                const pct = totalFunnel > 0 ? ((count / totalFunnel) * 100).toFixed(1) : '0';
                const revMap = [dataStats.approvedRev, dataStats.pendingRev, dataStats.rejectedRev];
                const rev = revMap[context.dataIndex];
                return ` ${context.label}: ${count} (${pct}%) · K${rev.toLocaleString()}`;
              },
            },
          },
        },
        onClick: (_, elements) => {
          if (elements.length > 0 && onPaymentStatusClick) {
            const idx = elements[0].index;
            const statuses = ['Approved', 'Pending', 'Rejected'];
            onPaymentStatusClick(statuses[idx]);
          }
        },
      },
    });

    return () => {
      if (financialChartInstance.current) financialChartInstance.current.destroy();
    };
  }, [dataStats, onPaymentStatusClick]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Chart 1: Modern Package Distribution Doughnut with Metric Toggle */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:border-slate-700/80 transition-all">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                Package Distribution
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Run packages breakdown</p>
            </div>

            {/* Interactive Toggle: Count vs Revenue */}
            <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px] font-semibold">
              <button
                onClick={() => setPackageMetric('count')}
                className={`px-2 py-1 rounded transition-colors ${
                  packageMetric === 'count'
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Runners
              </button>
              <button
                onClick={() => setPackageMetric('revenue')}
                className={`px-2 py-1 rounded transition-colors ${
                  packageMetric === 'revenue'
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Revenue (K)
              </button>
            </div>
          </div>
        </div>

        {/* Chart Canvas with Dynamic Center Badge */}
        <div className="relative h-64 w-full flex items-center justify-center my-1">
          <canvas ref={packageChartRef} />
          {/* Centered stat readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[11px] text-slate-400 font-medium">
              {packageMetric === 'revenue' ? 'Total' : 'Total'}
            </span>
            <span className="text-xl font-extrabold text-white font-mono tabular-nums">
              {packageMetric === 'revenue'
                ? `K${(dataStats.freeRev + dataStats.k150Rev + dataStats.k400Rev).toLocaleString()}`
                : `${participants.length}`}
            </span>
            <span className="text-[10px] text-pink-400 font-semibold">
              {packageMetric === 'revenue' ? 'ZMW' : 'Runners'}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Click slice to filter roster</span>
          <span className="font-mono text-slate-300 tabular-nums">
            {dataStats.k400Count} Mini DripKits
          </span>
        </div>
      </div>

      {/* Chart 2: Modern Demographic Origin Breakdown with Gradient & Metric Toggle */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:border-slate-700/80 transition-all">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Demographic Origin Breakdown
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Top cities & provincial hubs</p>
            </div>

            {/* Interactive Toggle: Count vs Revenue */}
            <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px] font-semibold">
              <button
                onClick={() => setDemographicMetric('count')}
                className={`px-2 py-1 rounded transition-colors ${
                  demographicMetric === 'count'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Runners
              </button>
              <button
                onClick={() => setDemographicMetric('revenue')}
                className={`px-2 py-1 rounded transition-colors ${
                  demographicMetric === 'revenue'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Revenue (K)
              </button>
            </div>
          </div>
        </div>

        <div className="relative h-64 w-full flex items-center justify-center my-1">
          <canvas ref={demographicChartRef} />
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Click bar to isolate city</span>
          <span className="text-emerald-400 font-medium">Top: Lusaka & Siavonga</span>
        </div>
      </div>

      {/* Chart 3: Modern Financial Approval Funnel with Revenue Overlay */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:border-slate-700/80 transition-all">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Financial Approval Funnel
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Collection verification status</p>
            </div>

            <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-400">
              K{dataStats.approvedRev.toLocaleString()} verified
            </div>
          </div>
        </div>

        <div className="relative h-64 w-full flex items-center justify-center my-1">
          <canvas ref={financialChartRef} />
          {/* Centered approval rate stat */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-slate-400 font-medium">Settled Rate</span>
            <span className="text-xl font-extrabold text-emerald-400 font-mono tabular-nums">
              {participants.length > 0
                ? Math.round((dataStats.approvedCount / participants.length) * 100)
                : 0}
              %
            </span>
            <span className="text-[10px] text-slate-400">
              {dataStats.approvedCount} of {participants.length}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Click slice to view pending</span>
          <span className="font-mono text-amber-400 tabular-nums">
            {dataStats.pendingCount} pending review
          </span>
        </div>
      </div>
    </div>
  );
};
