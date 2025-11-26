import React from "react";
import Chart from "react-apexcharts";
import { Candidate } from "../types";

interface ResultsChartProps {
  candidates: Candidate[];
  results: { [candidateId: string]: number };
  notaVotes?: number;
  theme?: "light" | "dark";
}

const ResultsChart: React.FC<ResultsChartProps> = ({
  candidates,
  results,
  notaVotes = 0,
  theme = "dark",
}) => {
  // Create series and labels for the pie chart
  const labels: string[] = [];
  const votes: number[] = [];

  candidates.forEach((candidate) => {
    labels.push(candidate.name);
    votes.push(results[candidate.id] || 0);
  });

  if (notaVotes > 0 || results["NOTA"]) {
    labels.push("NOTA");
    votes.push(notaVotes || results["NOTA"] || 0);
  }

  const isLightTheme = theme === 'light';

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "donut",
      foreColor: isLightTheme ? "#000000" : "#cbd5e1",
      toolbar: { show: false },
      background: isLightTheme ? '#FFFFFF' : 'transparent'
    },
    labels,
    legend: {
      position: "bottom",
      labels: { colors: isLightTheme ? "#000000" : "#cbd5e1" },
    },
    stroke: {
      width: 2,
      colors: isLightTheme ? ["#FFFFFF"] : ["#0f172a"], 
    },
    fill: {
      type: "gradient",
       gradient: {
        shade: "dark",
        gradientToColors: [
          "#8b5cf6",
          "#ec4899",
          "#3b82f6",
          "#22c55e",
          "#f59e0b",
        ],
        shadeIntensity: 0.9,
        type: "diagonal1",
        opacityFrom: 0.9,
        opacityTo: 0.9,
        stops: [0, 100],
      },
    },
    colors: [
      "#6d28d9",
      "#be185d",
      "#1d4ed8",
      "#15803d",
      "#b45309",
    ],

    dataLabels: {
      enabled: true,
      style: {
        colors: [isLightTheme ? "#000000" : "#ffffff"],
        fontSize: "14px",
        fontWeight: 600,
      },
      formatter: (val: number) => `${val.toFixed(1)}%`,
    },
    tooltip: {
      theme: isLightTheme ? "light" : "dark",
      y: {
        formatter: (val: number) => `${val} votes`,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "18px",
              color: isLightTheme ? "#000000" : "#e2e8f0",
            },
            value: {
              show: true,
              fontSize: "22px",
              color: isLightTheme ? "#000000" : "white",
              formatter: (value) => `${value} votes`,
            },
            total: {
              show: true,
              color: isLightTheme ? "#000000" : "#cbd5e1",
              label: "Total",
              formatter: () =>
                votes.reduce((sum, val) => sum + val, 0).toString(),
            },
          },
        },
      },
    },
  };

  const series = votes;

  return (
    <div style={{ backgroundColor: isLightTheme ? 'white' : 'transparent', padding: '1rem' }}>
      <h2 className={`text-center text-xl font-bold mb-4 ${isLightTheme ? 'text-black' : 'text-white'}`}>
        Total Votes
      </h2>
      <Chart options={options} series={series} type="donut" height={380} />
    </div>
  );
};

export default ResultsChart;
