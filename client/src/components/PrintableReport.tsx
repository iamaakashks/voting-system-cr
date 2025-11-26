import React from 'react';
import { Election } from '../types';
import ResultsChart from './ResultsChart';
import VotingTimelineChart from './VotingTimelineChart';
import VoterTurnoutAnalytics from './VoterTurnoutAnalytics';
import ResultsTable from './ResultsTable';
import { TimelineData, TurnoutData } from '../services/api';

interface PrintableReportProps {
  election: Election | null;
  timelineData: TimelineData[];
  turnoutData: TurnoutData | null;
}

const PrintableReport: React.FC<PrintableReportProps> = ({ election, timelineData, turnoutData }) => {
  if (!election) {
    return null;
  }

  return (
    <div style={{ 
      width: '750px', 
      padding: '30px', 
      backgroundColor: 'white', 
      color: 'black',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div id="pdf-section-header" style={{ 
        textAlign: 'center', 
        borderBottom: '2px solid #333', 
        paddingBottom: '15px', 
        marginBottom: '30px' 
      }}>
        <h1 style={{ 
          fontSize: '26px', 
          fontWeight: 'bold', 
          marginBottom: '8px',
          color: '#000'
        }}>Election Report</h1>
        <h2 style={{ 
          fontSize: '20px', 
          marginBottom: '8px',
          color: '#333'
        }}>{election.title}</h2>
        <p style={{ fontSize: '12px', color: '#666' }}>
          {new Date(election.startTime).toLocaleString()} - {new Date(election.endTime).toLocaleString()}
        </p>
      </div>

      <div id="pdf-section-table" style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
        <ResultsTable
          candidates={election.candidates}
          results={election.results}
          notaVotes={election.notaVotes || 0}
          theme="light"
        />
      </div>

      <div id="pdf-section-pie" style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
        <ResultsChart
          candidates={election.candidates}
          results={election.results}
          notaVotes={election.notaVotes || 0}
          theme="light"
        />
      </div>
      
      {timelineData.length > 0 && (
        <div id="pdf-section-timeline" style={{ marginBottom: '30px', pageBreakBefore: 'auto', pageBreakInside: 'avoid' }}>
          <VotingTimelineChart data={timelineData} theme="light" />
        </div>
      )}

      {turnoutData && (
        <div id="pdf-section-turnout" style={{ pageBreakBefore: 'auto', pageBreakInside: 'avoid' }}>
            <VoterTurnoutAnalytics data={turnoutData} theme="light" />
        </div>
      )}
    </div>
  );
};

export default PrintableReport;
