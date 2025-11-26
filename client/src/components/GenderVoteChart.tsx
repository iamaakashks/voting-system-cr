import React from "react";
import Chart from "react-apexcharts";
import { GenderStats } from "../services/api";

interface GenderVoteChartProps {
  data: GenderStats;
}

const GenderVoteChart: React.FC<GenderVoteChartProps> = ({ data }) => {
  // Guard against undefined or missing data
  if (!data || !data.candidates) {
    return (
      <div className="w-full text-center py-8">
        <p className="text-gray-400">No gender statistics available</p>
      </div>
    );
  }

  const categories: string[] = [];
  const maleVotes: number[] = [];
  const femaleVotes: number[] = [];

  data.candidates.forEach((c) => {
    const label =
      c.candidateName.length > 15
        ? c.candidateName.substring(0, 15) + "..."
        : c.candidateName;

    categories.push(label);
    maleVotes.push(c.maleVotes);
    femaleVotes.push(c.femaleVotes);
  });

  // Add NOTA if needed
  if (data.nota.maleVotes > 0 || data.nota.femaleVotes > 0) {
    categories.push("NOTA");
    maleVotes.push(data.nota.maleVotes);
    femaleVotes.push(data.nota.femaleVotes);
  }

  const series = [
    {
      name: "Male Votes",
      data: maleVotes,
    },
    {
      name: "Female Votes",
      data: femaleVotes,
    },
  ];

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "bar",
      foreColor: "#cbd5e1",
      toolbar: { show: false },
      animations: {
        enabled: true,
        speed: 650,
        easing: "easeinout",
      },
    },

    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "45%",
        borderRadius: 10,
      },
    },

    grid: {
      borderColor: "rgba(255,255,255,0.1)",
      strokeDashArray: 4,
    },

    colors: ["#60a5fa", "#ec4899"],

    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        type: "vertical",
        gradientToColors: ["#3b82f6", "#f472b6"],
        stops: [0, 50, 100],
        opacityFrom: 0.95,
        opacityTo: 0.95,
      },
    },

    tooltip: {
      theme: "dark",
      style: { fontSize: "14px" },
      y: {
        formatter: (val) => `${val} votes`,
      },
    },

    legend: {
      position: "bottom",
      fontSize: "14px",
      labels: { colors: "#cbd5e1" },
      markers: { radius: 12 },
    },

    xaxis: {
      categories,
      labels: {
        style: {
          fontSize: "13px",
          colors: "#d1d5db",
        },
      },
    },

    yaxis: {
      labels: {
        style: {
          fontSize: "13px",
          colors: "#d1d5db",
        },
      },
    },
  };

  return (
    <div className="w-full">
      <h4 className="text-xl font-bold text-white mb-4 text-center">
        Votes by Gender
      </h4>

      <Chart
        options={options}
        series={series}
        type="bar"
        height={420}
      />
    </div>
  );
};

export default GenderVoteChart;
