import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { TimelineData } from '../services/api';

interface VotingTimelineChartProps {
  data: TimelineData[];
}

const VotingTimelineChart: React.FC<VotingTimelineChartProps> = ({ data }) => {
  // Convert ISO timestamps to readable local time
  const chartData = data.map((item) => ({
    ...item,
    time: new Date(item.time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }));

  const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-3 border border-gray-700 rounded-lg shadow-lg">
          <p className="text-white font-semibold">Time: {label}</p>
          <p className="text-blue-300 text-sm">Votes: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <h4 className="text-xl font-bold text-white mb-4 text-center">
        Voting Timeline (Votes per Minute)
      </h4>

      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 40, left: 10, bottom: 50 }}
          >
            {/* Soft elegant grid */}
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />

            {/* X Axis */}
            <XAxis
              dataKey="time"
              stroke="#8fa3c8"
              tick={{ fill: '#b4c3da', fontSize: 12 }}
              angle={-35}
              textAnchor="end"
              height={70}
            />

            {/* Y Axis */}
            <YAxis
              stroke="#8fa3c8"
              allowDecimals={false}
              tick={{ fill: '#b4c3da', fontSize: 13 }}
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#cbd5e1' }} />

            {/* Line Gradients */}
            <defs>
              <linearGradient id="votesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6ea8ff" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.25} />
              </linearGradient>
            </defs>

            {/* OPTIONAL: Premium Area Glow Under Line */}
            <Line
              type="monotone"
              dataKey="votes"
              stroke="url(#votesGradient)"
              strokeWidth={3}
              name="Votes"
              fill="url(#votesGradient)"
              fillOpacity={0.3}
              dot={{
                fill: "#60a5fa",
                r: 4,
                strokeWidth: 2,
                stroke: "#1e40af",
              }}
              activeDot={{
                r: 7,
                stroke: "#93c5fd",
                strokeWidth: 3,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default VotingTimelineChart;
