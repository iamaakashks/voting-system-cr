import React from 'react';
import { Candidate } from '../types';

interface ResultsTableProps {
  candidates: Candidate[];
  results: { [candidateId: string]: number };
  notaVotes: number;
  theme?: 'light' | 'dark';
}

const ResultsTable: React.FC<ResultsTableProps> = ({
  candidates,
  results,
  notaVotes,
  theme = 'dark',
}) => {
  const isLightTheme = theme === 'light';

  // Combine candidates and NOTA into a single array for rendering
  const allResults = [
    ...candidates.map(c => ({
      name: c.name,
      votes: results[c.id] || 0,
    })),
  ];
  // Add NOTA only if it has votes or was an option
  if (notaVotes > 0 || results['NOTA'] !== undefined) {
      allResults.push({ name: 'None of the Above (NOTA)', votes: notaVotes });
  }

  const containerStyle = {
    backgroundColor: isLightTheme ? 'white' : 'transparent',
    color: isLightTheme ? 'black' : 'white',
    padding: '1rem',
  };

  const tableHeaderStyle = {
    borderBottom: `2px solid ${isLightTheme ? '#e5e7eb' : '#374151'}`,
    padding: '0.75rem',
    textAlign: 'left' as const,
    fontSize: '0.875rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  };

  const tableCellStyle = {
    borderBottom: `1px solid ${isLightTheme ? '#f3f4f6' : '#1f2937'}`,
    padding: '0.75rem',
  };


  return (
    <div style={containerStyle}>
      <h3 className={`text-xl font-bold text-center mb-4 ${isLightTheme ? 'text-black' : 'text-white'}`}>
        Vote Summary
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={tableHeaderStyle}>Candidate</th>
            <th style={tableHeaderStyle}>Votes</th>
          </tr>
        </thead>
        <tbody>
          {allResults.sort((a, b) => b.votes - a.votes).map((item, index) => (
            <tr key={index}>
              <td style={tableCellStyle}>{item.name}</td>
              <td style={tableCellStyle}>{item.votes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;
