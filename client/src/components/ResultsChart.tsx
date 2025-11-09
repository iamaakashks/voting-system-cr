
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Candidate } from '../types';

interface ResultsChartProps {
  candidates: Candidate[];
  results: { [candidateId: string]: number };
}

const COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899'];

const ResultsChart: React.FC<ResultsChartProps> = ({ candidates, results }) => {
  const chartData = candidates.map(candidate => ({
    name: candidate.name,
    votes: results[candidate.id] || 0,
  })).sort((a, b) => b.votes - a.votes);

  const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 p-2 border border-gray-700 rounded-md shadow-lg">
          <p className="label text-white">{`${label} : ${payload[0].value} votes`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          barGap={10}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
          <XAxis dataKey="name" stroke="#a0aec0" tick={{ fill: '#a0aec0' }} />
          <YAxis stroke="#a0aec0" allowDecimals={false} tick={{ fill: '#a0aec0' }}/>
          <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(128, 128, 128, 0.1)'}} />
          <Legend wrapperStyle={{ color: '#a0aec0' }} />
          <Bar dataKey="votes" name="Total Votes" fill="#8884d8">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ResultsChart;
