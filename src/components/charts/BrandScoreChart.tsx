import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface BrandScoreChartProps {
  score: number;
  size?: number;
}

const BrandScoreChart = ({ score, size = 200 }: BrandScoreChartProps) => {
  // Create data for the pie chart
  const data = [
    { name: 'Score', value: score, color: '#3b82f6' },
    { name: 'Remaining', value: 100 - score, color: '#e5e7eb' }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Work';
  };

  // Update the color based on score
  data[0].color = getScoreColor(score);

  return (
    <div className="relative">
      <ResponsiveContainer width={size} height={size}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.25}
            outerRadius={size * 0.4}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">{score}</div>
          <div className="text-sm text-gray-500">/ 100</div>
          <div className={`text-xs font-medium mt-1 ${
            score >= 80 ? 'text-green-600' : 
            score >= 60 ? 'text-yellow-600' : 
            'text-red-600'
          }`}>
            {getScoreLabel(score)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandScoreChart;