import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { GenderStats } from '../services/api';

interface GenderVoteChartProps {
  data: GenderStats;
}

const GenderVoteChart: React.FC<GenderVoteChartProps> = ({ data }) => {
  // Prepare data for grouped bar chart
  const chartData = data.candidates.map(candidate => ({
    name: candidate.candidateName.length > 15 ? candidate.candidateName.substring(0, 15) + '...' : candidate.candidateName,
    fullName: candidate.candidateName,
    male: candidate.maleVotes,
    female: candidate.femaleVotes,
  }));

  // Add NOTA if there are votes
  if (data.nota.maleVotes > 0 || data.nota.femaleVotes > 0) {
    chartData.push({
      name: 'NOTA',
      fullName: 'NOTA',
      male: data.nota.maleVotes,
      female: data.nota.femaleVotes,
    });
  }

  const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 p-3 border border-gray-700 rounded-md shadow-lg">
          <p className="text-white font-semibold mb-2">{payload[0].payload.fullName || label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-gray-300" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value} votes`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <h4 className="text-xl font-bold text-white mb-4 text-center">Votes by Gender</h4>
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
            <XAxis 
              dataKey="name" 
              stroke="#a0aec0" 
              tick={{ fill: '#a0aec0', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis 
              stroke="#a0aec0" 
              allowDecimals={false} 
              tick={{ fill: '#a0aec0' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#a0aec0' }} />
            <Bar dataKey="male" name="Male Votes" fill="#3b82f6" barSize={20} />
            <Bar dataKey="female" name="Female Votes" fill="#ec4899" barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GenderVoteChart;

