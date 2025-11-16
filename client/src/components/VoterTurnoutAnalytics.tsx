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
}

const VoterTurnoutAnalytics: React.FC<VoterTurnoutAnalyticsProps> = ({
  data,
}) => {
  // Convert ISO timestamps to local time for display
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
      <h4 className="text-xl font-bold text-white mb-4 text-center">
        Voter Turnout Analytics
      </h4>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">Total Eligible Voters</p>
          <p className="text-2xl font-bold text-white">
            {data.totalEligibleVoters}
          </p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">Total Votes Cast</p>
          <p className="text-2xl font-bold text-white">{data.totalVotesCast}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">Voter Turnout</p>
          <p className="text-2xl font-bold text-green-400">
            {data.voterTurnoutPercentage}%
          </p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">Remaining Voters</p>
          <p className="text-2xl font-bold text-yellow-400">
            {data.remainingVoters}
          </p>
        </div>
      </div>

      {/* Live Turnout Graph */}
      <div className="bg-[#0f172a] p-6 rounded-2xl border border-gray-700 shadow-xl shadow-black/20 backdrop-blur-md">
        <h5 className="text-lg font-semibold text-white mb-4 text-center">
          Live Turnout Over Time
        </h5>

        <div style={{ width: "100%", height: 400 }}>
          <ResponsiveContainer>
            <LineChart
              data={chartData.timeline}
              margin={{ top: 20, right: 40, left: 10, bottom: 50 }}
            >
              {/* Soft grid like Image-1 */}
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.08)"
              />

              {/* X-Axis */}
              <XAxis
                dataKey="time"
                stroke="#8fa3c8"
                tick={{ fill: "#b4c3da", fontSize: 12 }}
                angle={-35}
                textAnchor="end"
                height={70}
              />

              {/* Y-Axis Left (Votes) */}
              <YAxis
                yAxisId="left"
                stroke="#8fa3c8"
                tick={{ fill: "#b4c3da" }}
                label={{
                  value: "Votes",
                  angle: -90,
                  position: "insideLeft",
                  style: { fill: "#a0aec0" },
                }}
              />

              {/* Y-Axis Right (Turnout %) */}
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#8fa3c8"
                tick={{ fill: "#b4c3da" }}
                domain={[0, 100]}
                label={{
                  value: "Turnout %",
                  angle: 90,
                  position: "insideRight",
                  style: { fill: "#a0aec0" },
                }}
              />

              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: "#cbd5e1", paddingTop: 20 }} />

              {/* Blue smooth votes line */}
              <defs>
                <linearGradient id="voteGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity="1" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
                </linearGradient>

                {/* Green turnout line gradient */}
                <linearGradient
                  id="turnoutGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#34d399" stopOpacity="1" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              {/* Main Votes Line */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="votes"
                stroke="url(#voteGradient)"
                strokeWidth={3}
                dot={{
                  fill: "#60a5fa",
                  r: 4,
                  strokeWidth: 2,
                  stroke: "#1e40af",
                }}
                activeDot={{
                  r: 6,
                  stroke: "#93c5fd",
                  strokeWidth: 2,
                }}
                name="Cumulative Votes"
              />

              {/* Green Turnout Line */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="percentage"
                stroke="url(#turnoutGradient)"
                strokeWidth={3}
                dot={{
                  fill: "#34d399",
                  r: 4,
                  strokeWidth: 2,
                  stroke: "#065f46",
                }}
                activeDot={{
                  r: 6,
                  stroke: "#6ee7b7",
                  strokeWidth: 2,
                }}
                name="Turnout %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default VoterTurnoutAnalytics;
