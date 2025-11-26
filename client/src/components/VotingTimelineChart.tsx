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
  theme?: 'light' | 'dark';
}

const VotingTimelineChart: React.FC<VotingTimelineChartProps> = ({ data, theme = 'dark' }) => {
  const isLightTheme = theme === 'light';
  
  // Guard against undefined or empty data
  if (!data || data.length === 0) {
    return (
      <div className="w-full text-center py-8">
        <p className={isLightTheme ? "text-gray-600" : "text-gray-400"}>No timeline data available</p>
      </div>
    );
  }
  
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
        <div style={{
          backgroundColor: isLightTheme ? '#ffffff' : '#1f2937',
          padding: '0.75rem',
          border: '1px solid',
          borderColor: isLightTheme ? '#cccccc' : '#374151',
          borderRadius: '0.5rem',
        }}>
          <p style={{ color: isLightTheme ? '#000000' : '#ffffff' }} className="font-semibold">Time: {label}</p>
          <p style={{ color: isLightTheme ? '#3b82f6' : '#93c5fd' }} className="text-sm">Votes: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ backgroundColor: isLightTheme ? 'white' : 'transparent', padding: '1rem', width: '100%' }}>
      <h4 className={`text-xl font-bold mb-4 text-center ${isLightTheme ? 'text-black' : 'text-white'}`}>
        Voting Timeline (Votes per Minute)
      </h4>

      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 40, left: 10, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={isLightTheme ? "#dddddd" : "rgba(255,255,255,0.08)"} />

            <XAxis
              dataKey="time"
              stroke={isLightTheme ? "#333333" : "#8fa3c8"}
              tick={{ fill: isLightTheme ? '#000000' : '#b4c3da', fontSize: 12 }}
              angle={-35}
              textAnchor="end"
              height={70}
            />

            <YAxis
              stroke={isLightTheme ? "#333333" : "#8fa3c8"}
              allowDecimals={false}
              tick={{ fill: isLightTheme ? '#000000' : '#b4c3da', fontSize: 13 }}
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: isLightTheme ? '#000000' : '#cbd5e1' }} />

            <Line
              type="monotone"
              dataKey="votes"
              stroke={isLightTheme ? "#1d4ed8" : "#6ea8ff"}
              strokeWidth={3}
              name="Votes"
              dot={{
                fill: isLightTheme ? "#1d4ed8" : "#60a5fa",
                r: 5,
                strokeWidth: 2,
                stroke: isLightTheme ? "#ffffff" : "#1e40af",
              }}
              activeDot={{
                r: 8,
                stroke: isLightTheme ? "#1d4ed8" : "#93c5fd",
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
