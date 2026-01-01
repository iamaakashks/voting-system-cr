import React, { forwardRef } from 'react';
import { Election } from '../types';
import ResultsChart from './ResultsChart';
import VotingTimelineChart from './VotingTimelineChart';
import VoterTurnoutAnalytics from './VoterTurnoutAnalytics';
import ResultsTable from './ResultsTable';
import { TimelineData, TurnoutData } from '../services/api';

interface PrintOptimizedReportProps {
  election: Election | null;
  timelineData: TimelineData[];
  turnoutData: TurnoutData | null;
  qrCodeDataUrl?: string;
}

const PrintOptimizedReport = forwardRef<HTMLDivElement, PrintOptimizedReportProps>(
  ({ election, timelineData, turnoutData, qrCodeDataUrl }, ref) => {
    if (!election) {
      return null;
    }

    // Convert results object to array format
    const resultsArray = Object.entries(election.results || {}).map(([candidateId, voteCount]) => ({
      candidateId,
      voteCount: typeof voteCount === 'number' ? voteCount : 0
    }));

    const validVotes = resultsArray.reduce((sum, r) => sum + r.voteCount, 0);
    const notaVotes = election.notaVotes || 0;
    const totalCast = validVotes + notaVotes;
    const reportId = `${election.id}-${Date.now()}`;
    const timestamp = new Date().toLocaleString();

    // Calculate statistics
    const eligibleVoters = (election as any).eligibleVoters || totalCast;
    const turnoutPercentage = eligibleVoters > 0 ? ((totalCast / eligibleVoters) * 100).toFixed(2) : '0.00';

    // Find winner
    const winner = resultsArray.length > 0
      ? resultsArray.reduce((prev, current) => (prev.voteCount > current.voteCount ? prev : current))
      : null;
    
    const winnerCandidate = winner
      ? election.candidates.find(c => c.id === winner.candidateId)
      : null;

    // Calculate competitiveness
    const sortedResults = [...resultsArray].sort((a, b) => b.voteCount - a.voteCount);
    const competitivenessIndex = sortedResults.length >= 2 && totalCast > 0
      ? (((sortedResults[0].voteCount - sortedResults[1].voteCount) / totalCast) * 100).toFixed(2)
      : '100.00';

    return (
      <div ref={ref} style={{ padding: '15mm 20mm', backgroundColor: 'white', color: 'black', minHeight: 'auto' }}>
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 15mm;
            }
            
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            
            .page-break {
              page-break-before: always;
            }
            
            .avoid-break {
              page-break-inside: avoid;
            }
            
            .chart-container {
              width: 100% !important;
              height: auto !important;
              display: block !important;
              page-break-inside: avoid !important;
            }
            
            .chart-container svg {
              max-width: 100% !important;
              height: auto !important;
            }
            
            canvas {
              max-width: 100% !important;
              height: auto !important;
            }
            
            /* Force recharts to render properly in print */
            .recharts-responsive-container {
              position: relative !important;
              width: 750px !important;
              height: 400px !important;
            }
            
            .recharts-wrapper {
              position: relative !important;
              width: 750px !important;
              height: 400px !important;
            }
            
            .recharts-surface {
              width: 750px !important;
              height: 400px !important;
            }
            
            /* Fix legend styling */
            .recharts-legend-wrapper {
              position: relative !important;
              margin-top: 10px !important;
            }
            
            .recharts-legend-item {
              font-size: 12px !important;
              margin-right: 15px !important;
            }
            
            .recharts-legend-item-text {
              font-size: 12px !important;
              color: #333 !important;
            }
            
            .recharts-surface .recharts-legend-item svg {
              width: 14px !important;
              height: 14px !important;
            }
            
            /* Make legend symbols smaller */
            .recharts-default-legend .recharts-surface {
              width: 14px !important;
              height: 14px !important;
            }
          }
          
          .print-report {
            font-family: 'Arial', 'Helvetica', sans-serif;
            line-height: 1.6;
          }
          
          .print-header {
            text-align: center;
            border-bottom: 3px solid #000;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }
          
          .print-section {
            margin-bottom: 20px;
            padding: 10px;
          }
          
          .print-section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #000;
            border-bottom: 2px solid #ccc;
            padding-bottom: 5px;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 20px 0;
          }
          
          .stat-card {
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 8px;
            background-color: #f9f9f9;
          }
          
          .stat-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #000;
          }
          
          .footer-text {
            font-size: 10px;
            color: #666;
            text-align: center;
            margin-top: 20px;
            padding-top: 10px;
            padding-bottom: 0;
            margin-bottom: 0;
            border-top: 1px solid #ccc;
          }
        `}</style>

        <div className="print-report">
          {/* Header Section */}
          <div className="print-header avoid-break">
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#000' }}>
              VeriVote Election Report
            </h1>
            <h2 style={{ fontSize: '22px', margin: '0 0 10px 0', color: '#333' }}>
              {election.title}
            </h2>
            <p style={{ fontSize: '14px', color: '#666', margin: '5px 0' }}>
              <strong>Start:</strong> {new Date(election.startTime).toLocaleString()} | 
              <strong> End:</strong> {new Date(election.endTime).toLocaleString()}
            </p>
            <p style={{ fontSize: '12px', color: '#999', margin: '5px 0' }}>
              Report ID: {reportId} | Generated: {timestamp}
            </p>
            {qrCodeDataUrl && (
              <div style={{ marginTop: '15px' }}>
                <img src={qrCodeDataUrl} alt="Election QR Code" style={{ width: '80px', height: '80px' }} />
              </div>
            )}
          </div>

          {/* Executive Summary */}
          <div className="print-section avoid-break">
            <h3 className="print-section-title">Executive Summary</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Total Votes Cast</div>
                <div className="stat-value">{totalCast.toLocaleString()}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Voter Turnout</div>
                <div className="stat-value">{turnoutPercentage}%</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Valid Votes</div>
                <div className="stat-value">{validVotes.toLocaleString()}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">NOTA Votes</div>
                <div className="stat-value">{notaVotes.toLocaleString()}</div>
              </div>
            </div>
            
            {winnerCandidate && (
              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f9ff', border: '2px solid #0ea5e9', borderRadius: '8px' }}>
                <p style={{ fontSize: '14px', margin: '0 0 5px 0', color: '#666' }}>Winner</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '0', color: '#000' }}>
                  {winnerCandidate.name}
                </p>
                <p style={{ fontSize: '14px', margin: '5px 0 0 0', color: '#666' }}>
                  {winner!.voteCount.toLocaleString()} votes ({((winner!.voteCount / totalCast) * 100).toFixed(2)}%)
                </p>
              </div>
            )}
          </div>

          {/* Election Details */}
          <div className="print-section avoid-break">
            <h3 className="print-section-title">Election Details</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold', width: '40%' }}>Election ID:</td>
                  <td style={{ padding: '10px' }}>{election.id}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>Status:</td>
                  <td style={{ padding: '10px', textTransform: 'capitalize' }}>{election.status}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>Eligible Voters:</td>
                  <td style={{ padding: '10px' }}>{eligibleVoters.toLocaleString()}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>Number of Candidates:</td>
                  <td style={{ padding: '10px' }}>{election.candidates.length}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>Competitiveness Index:</td>
                  <td style={{ padding: '10px' }}>{competitivenessIndex}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Results Table */}
          <div className="print-section page-break">
            <h3 className="print-section-title">Detailed Results</h3>
            <ResultsTable
              candidates={election.candidates}
              results={election.results}
              notaVotes={election.notaVotes || 0}
              theme="light"
            />
          </div>

          {/* Results Chart */}
          <div className="print-section avoid-break">
            <h3 className="print-section-title">Vote Distribution</h3>
            <div className="chart-container">
              <ResultsChart
                candidates={election.candidates}
                results={election.results}
                notaVotes={election.notaVotes || 0}
                theme="light"
              />
            </div>
          </div>


          {/* Timeline Chart */}
          {timelineData.length > 0 && (
            <div className="print-section page-break">
              <h3 className="print-section-title">Voting Timeline</h3>
              <div style={{ width: '750px', height: '450px', minHeight: '450px', overflow: 'visible' }}>
                <VotingTimelineChart data={timelineData} theme="light" />
              </div>
            </div>
          )}

          {/* Voter Turnout Analytics */}
          {turnoutData && (
            <div className="print-section page-break">
              <h3 className="print-section-title">Voter Turnout Analytics</h3>
              <div style={{ width: '750px', minHeight: '600px', overflow: 'visible' }}>
                <VoterTurnoutAnalytics data={turnoutData} theme="light" />
              </div>
            </div>
          )}

          {/* Security & Verification */}
          <div className="print-section page-break">
            <h3 className="print-section-title">Security & Verification</h3>
            <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
              <p style={{ fontSize: '14px', marginBottom: '10px' }}>
                <strong>Blockchain Security:</strong> All votes are recorded on an immutable blockchain ledger,
                ensuring tamper-proof results.
              </p>
              <p style={{ fontSize: '14px', marginBottom: '10px' }}>
                <strong>Cryptographic Verification:</strong> Each vote is cryptographically signed and verified
                using digital signatures.
              </p>
              <p style={{ fontSize: '14px', marginBottom: '10px' }}>
                <strong>Audit Trail:</strong> Complete audit trail available for verification and transparency.
              </p>
              <p style={{ fontSize: '14px', margin: '0' }}>
                <strong>Anonymous Voting:</strong> Voter privacy is maintained while ensuring vote authenticity.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="footer-text">
            <p style={{ margin: '3px 0', fontSize: '10px' }}>
              Generated by VeriVote - Blockchain-Based Voting System
            </p>
            <p style={{ margin: '3px 0', fontSize: '9px' }}>
              {timestamp} | Report ID: {reportId}
            </p>
            <p style={{ margin: '3px 0 0 0', fontSize: '8px' }}>
              This report is generated from verified blockchain data and is cryptographically secure.
            </p>
          </div>
        </div>
      </div>
    );
  }
);

PrintOptimizedReport.displayName = 'PrintOptimizedReport';

export default PrintOptimizedReport;
