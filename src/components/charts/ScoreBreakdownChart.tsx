import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip, ReferenceLine, LabelList } from 'recharts';

interface ScoreData {
  name: string;
  score: number;
  maxScore: number;
  color?: string;
}

interface ScoreBreakdownChartProps {
  data: ScoreData[];
}

const tips: Record<string, string> = {
  Website: 'Improve Core Web Vitals, fix technical SEO, and enrich top pages.',
  Social: 'Increase posting cadence, engage comments, and add CTAs to bios.',
  Reputation: 'Ask happy customers for reviews and reply to all feedback.',
  Visibility: 'Target local keywords and claim directory listings.',
  Consistency: 'Align NAP, colors, logo and tone across channels.',
  Positioning: 'Clarify UVP above the fold and on social bios.',
};

const ScoreBreakdownChart = ({ data }: ScoreBreakdownChartProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  // Prepare data with background max bars so zero scores still render context
  const chartData = data.map(item => ({
    name: item.name,
    score: typeof item.score === 'number' ? Math.max(0, Math.min(100, item.score)) : 0,
    max: 100,
    color: getScoreColor(item.score || 0),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const value = payload.find((p: any) => p.dataKey === 'score')?.value ?? 0;
    return (
      <div className="rounded-md border bg-white p-3 shadow-sm">
        <div className="text-sm font-semibold mb-1">{label}: {value}/100</div>
        <div className="text-xs text-gray-600">{tips[label] || 'Focus improvements to lift this factor.'}</div>
      </div>
    );
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 16, right: 24, left: 24, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis type="category" dataKey="name" width={120} stroke="#6b7280" fontSize={12} />

          {/* Benchmark line at 70 */}
          <ReferenceLine x={70} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'Benchmark 70', position: 'insideTopRight', fill: '#64748b', fontSize: 10 }} />

          {/* Background max bar */}
          <Bar dataKey="max" stackId="a" fill="#f1f5f9" radius={[4, 4, 4, 4]} />
          {/* Actual score bar */}
          <Bar dataKey="score" stackId="a" radius={[4, 4, 4, 4]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <LabelList dataKey="score" position="right" formatter={(v: any) => `${v}`} className="text-xs fill-gray-700" />
          </Bar>

          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScoreBreakdownChart;