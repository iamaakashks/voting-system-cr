import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TurnoutData } from '../services/api';

interface VoterTurnoutAnalyticsProps {
  data: TurnoutData;
}

const VoterTurnoutAnalytics: React.FC<VoterTurnoutAnalyticsProps> = ({ data }) => {
  const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 p-3 border border-gray-700 rounded-md shadow-lg">
          <p className="text-white font-semibold mb-1">{`Time: ${label}`}</p>
          <p className="text-gray-300">{`Votes: ${payload[0].value}`}</p>
          <p className="text-gray-300">{`Turnout: ${payload[1].value}%`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-6">
      <h4 className="text-xl font-bold text-white mb-4 text-center">Voter Turnout Analytics</h4>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">Total Eligible Voters</p>
          <p className="text-2xl font-bold text-white">{data.totalEligibleVoters}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">Total Votes Cast</p>
          <p className="text-2xl font-bold text-white">{data.totalVotesCast}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">Voter Turnout</p>
          <p className="text-2xl font-bold text-green-400">{data.voterTurnoutPercentage}%</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">Remaining Voters</p>
          <p className="text-2xl font-bold text-yellow-400">{data.remainingVoters}</p>
        </div>
      </div>

      {/* Live Turnout Graph */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h5 className="text-lg font-semibold text-white mb-4 text-center">Live Turnout Over Time</h5>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <LineChart
              data={data.timeline}
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
                tick={{ fill: '#a0aec0' }}
                yAxisId="left"
                label={{ value: 'Votes', angle: -90, position: 'insideLeft', style: { fill: '#a0aec0' } }}
              />
              <YAxis 
                stroke="#a0aec0" 
                tick={{ fill: '#a0aec0' }}
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                label={{ value: 'Turnout %', angle: 90, position: 'insideRight', style: { fill: '#a0aec0' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#a0aec0' }} />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="votes" 
                stroke="#60a5fa" 
                strokeWidth={2}
                name="Cumulative Votes"
                dot={{ fill: '#60a5fa', r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="percentage" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Turnout %"
                dot={{ fill: '#10b981', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default VoterTurnoutAnalytics;

