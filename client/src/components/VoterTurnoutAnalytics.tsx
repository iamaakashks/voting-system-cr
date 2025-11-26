import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TurnoutData } from "../services/api";

interface VoterTurnoutAnalyticsProps {
  data: TurnoutData;
  theme?: "light" | "dark";
}

const VoterTurnoutAnalytics: React.FC<VoterTurnoutAnalyticsProps> = ({
  data,
  theme = "dark",
}) => {
  const isLightTheme = theme === 'light';

  // Guard against undefined or missing data
  if (!data || !data.timeline) {
    return (
      <div className="w-full text-center py-8">
        <p className={isLightTheme ? "text-gray-600" : "text-gray-400"}>No turnout data available</p>
      </div>
    );
  }

  const chartData = {
    ...data,
    timeline: data.timeline.map((item) => ({
      ...item,
      time: new Date(item.time).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    })),
  };

  const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: isLightTheme ? '#ffffff' : '#1f2937',
          padding: '0.75rem',
          border: '1px solid',
          borderColor: isLightTheme ? '#cccccc' : '#374151',
        }}>
          <p style={{color: isLightTheme ? '#000000' : '#ffffff'}} className="font-semibold mb-1">{`Time: ${label}`}</p>
          <p style={{color: isLightTheme ? '#333333' : '#e5e7eb'}}>{`Votes: ${payload[0].value}`}</p>
          <p style={{color: isLightTheme ? '#333333' : '#e5e7eb'}}>{`Turnout: ${payload[1].value}%`}</p>
        </div>
      );
    }
    return null;
  };

  const cardStyle = {
    backgroundColor: isLightTheme ? '#f9f9f9' : '#1f2937',
    padding: '1rem',
    borderRadius: '0.5rem',
    border: '1px solid',
    borderColor: isLightTheme ? '#eeeeee' : '#374151'
  };

  const textMuted = { color: isLightTheme ? '#555555' : '#9ca3af' };
  const textMain = { color: isLightTheme ? '#000000' : '#ffffff' };


  return (
    <div className="w-full space-y-6" style={{ padding: isLightTheme ? '1rem' : '0', backgroundColor: isLightTheme ? 'white' : 'transparent'}}>
      <h4 className={`text-xl font-bold mb-4 text-center ${isLightTheme ? 'text-black' : 'text-white'}`}>
        Voter Turnout Analytics
      </h4>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div style={cardStyle}>
          <p style={textMuted} className="text-sm mb-1">Total Eligible Voters</p>
          <p style={textMain} className="text-2xl font-bold">{data.totalEligibleVoters}</p>
        </div>
        <div style={cardStyle}>
          <p style={textMuted} className="text-sm mb-1">Total Votes Cast</p>
          <p style={textMain} className="text-2xl font-bold">{data.totalVotesCast}</p>
        </div>
        <div style={cardStyle}>
          <p style={textMuted} className="text-sm mb-1">Voter Turnout</p>
          <p style={{color: isLightTheme ? '#16a34a' : '#4ade80'}} className="text-2xl font-bold">{data.voterTurnoutPercentage}%</p>
        </div>
        <div style={cardStyle}>
          <p style={textMuted} className="text-sm mb-1">Remaining Voters</p>
          <p style={{color: isLightTheme ? '#facc15' : '#fde047'}} className="text-2xl font-bold">{data.remainingVoters}</p>
        </div>
      </div>

      {/* Live Turnout Graph */}
      <div style={{
          backgroundColor: isLightTheme ? '#f9f9f9' : '#0f172a',
          padding: '1.5rem',
          borderRadius: '1rem',
          border: '1px solid',
          borderColor: isLightTheme ? '#eeeeee' : '#374151'
        }}>
        <h5 className={`text-lg font-semibold text-center mb-4 ${isLightTheme ? 'text-black' : 'text-white'}`}>
          Live Turnout Over Time
        </h5>

        <div style={{ width: "100%", height: 400 }}>
          <ResponsiveContainer>
            <LineChart data={chartData.timeline} margin={{ top: 20, right: 40, left: 10, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isLightTheme ? "#dddddd" : "rgba(255,255,255,0.08)"} />
              <XAxis dataKey="time" stroke={isLightTheme ? "#333" : "#8fa3c8"} tick={{ fill: isLightTheme ? "#000" : "#b4c3da", fontSize: 12 }} angle={-35} textAnchor="end" height={70}/>
              <YAxis yAxisId="left" stroke={isLightTheme ? "#333" : "#8fa3c8"} tick={{ fill: isLightTheme ? "#000" : "#b4c3da" }} label={{ value: "Votes", angle: -90, position: "insideLeft", style: { fill: isLightTheme ? "#555" : "#a0aec0" },}}/>
              <YAxis yAxisId="right" orientation="right" stroke={isLightTheme ? "#333" : "#8fa3c8"} tick={{ fill: isLightTheme ? "#000" : "#b4c3da" }} domain={[0, 100]} label={{ value: "Turnout %", angle: 90, position: "insideRight", style: { fill: isLightTheme ? "#555" : "#a0aec0" },}}/>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: isLightTheme ? "#000" : "#cbd5e1", paddingTop: 20 }} />
              <Line yAxisId="left" type="monotone" dataKey="votes" stroke={isLightTheme ? "#1d4ed8" : "#60a5fa"} strokeWidth={3} name="Cumulative Votes" dot={{fill: isLightTheme ? "#1d4ed8" : "#60a5fa", r: 4}} activeDot={{r: 7}}/>
              <Line yAxisId="right" type="monotone" dataKey="percentage" stroke={isLightTheme ? "#15803d" : "#34d399"} strokeWidth={3} name="Turnout %" dot={{fill: isLightTheme ? "#15803d" : "#34d399", r: 4}} activeDot={{r: 7}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default VoterTurnoutAnalytics;
