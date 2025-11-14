import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TimelineData } from '../services/api';

interface VotingTimelineChartProps {
  data: TimelineData[];
}

const VotingTimelineChart: React.FC<VotingTimelineChartProps> = ({ data }) => {
  const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 p-3 border border-gray-700 rounded-md shadow-lg">
          <p className="text-white font-semibold mb-1">{`Time: ${label}`}</p>
          <p className="text-gray-300">{`Votes: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <h4 className="text-xl font-bold text-white mb-4 text-center">Voting Timeline (Votes per Minute)</h4>
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
            <XAxis 
              dataKey="time" 
              stroke="#a0aec0" 
              tick={{ fill: '#a0aec0', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#a0aec0" 
              allowDecimals={false} 
              tick={{ fill: '#a0aec0' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#a0aec0' }} />
            <Line 
              type="monotone" 
              dataKey="votes" 
              stroke="#60a5fa" 
              strokeWidth={2}
              name="Votes"
              dot={{ fill: '#60a5fa', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default VotingTimelineChart;

