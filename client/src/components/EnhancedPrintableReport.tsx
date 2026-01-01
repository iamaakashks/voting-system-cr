import React from 'react';
import { Election } from '../types';
import ResultsChart from './ResultsChart';
import VotingTimelineChart from './VotingTimelineChart';
import VoterTurnoutAnalytics from './VoterTurnoutAnalytics';
import ResultsTable from './ResultsTable';
import { TimelineData, TurnoutData } from '../services/api';
import {
  getWinner,
  getCompetitivenessMetrics,
  getPeakVotingAnalysis,
  getStatisticalMetrics,
  getThresholdAnalysis,
  generateReportId,
  generateReportHash,
  generateInsights,
  generateRecommendations
} from '../utils/reportAnalytics';
import { Vote, TrendingUp, Users, Award, BarChart3, Clock, Shield, CheckCircle2 } from 'lucide-react';

interface EnhancedPrintableReportProps {
  election: Election | null;
  timelineData: TimelineData[];
  turnoutData: TurnoutData | null;
  qrCodeDataUrl?: string;
}

const EnhancedPrintableReport: React.FC<EnhancedPrintableReportProps> = ({ 
  election, 
  timelineData, 
  turnoutData,
  qrCodeDataUrl 
}) => {
  if (!election) {
    return null;
  }

  // Calculate all analytics
  const winner = getWinner(election);
  const competitiveness = getCompetitivenessMetrics(election);
  const peakAnalysis = getPeakVotingAnalysis(timelineData);
  const statistics = getStatisticalMetrics(election);
  const threshold = getThresholdAnalysis(election);
  const reportId = generateReportId(election);
  const reportHash = generateReportHash(election);
  const insights = generateInsights(election, turnoutData, competitiveness, peakAnalysis);
  const recommendations = generateRecommendations(turnoutData, peakAnalysis);

  const sectionStyle = {
    marginBottom: '30px',
    pageBreakInside: 'avoid' as const
  };

  const headingStyle = {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#000',
    borderBottom: '2px solid #333',
    paddingBottom: '8px'
  };

  const cardStyle = {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
    marginBottom: '15px'
  };

  const metricCardStyle = {
    backgroundColor: '#ffffff',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #e0e0e0',
    textAlign: 'center' as const,
    minHeight: '80px'
  };

  return (
    <div style={{ 
      width: '750px', 
      padding: '30px', 
      backgroundColor: 'white', 
      color: 'black',
      fontFamily: 'Arial, sans-serif'
    }}>
      
      {/* HEADER WITH BRANDING */}
      <div id="pdf-section-header" style={{ 
        textAlign: 'center', 
        borderBottom: '3px solid #000', 
        paddingBottom: '20px', 
        marginBottom: '30px',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
          <div style={{ 
            backgroundColor: '#6366f1', 
            padding: '8px', 
            borderRadius: '8px', 
            marginRight: '10px' 
          }}>
            <Vote size={32} color="white" />
          </div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            margin: '0',
            color: '#000'
          }}>VeriVote</h1>
        </div>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '8px',
          color: '#333'
        }}>OFFICIAL ELECTION REPORT</h2>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
          National Institute of Engineering, Mysore
        </p>
        <div style={{ 
          display: 'inline-block',
          backgroundColor: '#f0f0f0',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '11px',
          color: '#666',
          marginTop: '8px'
        }}>
          Report ID: <strong>{reportId}</strong> | Generated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* EXECUTIVE SUMMARY */}
      <div id="pdf-section-executive" style={sectionStyle}>
        <h3 style={headingStyle}>
          <Award size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
          Executive Summary
        </h3>
        
        {/* Winner Declaration Box */}
        <div style={{ 
          ...cardStyle,
          backgroundColor: '#e8f5e9',
          borderLeft: '4px solid #4caf50',
          padding: '20px'
        }}>
          <h4 style={{ 
            fontSize: '16px', 
            fontWeight: 'bold', 
            marginBottom: '12px',
            color: '#2e7d32'
          }}>
            🏆 Election Winner
          </h4>
          {winner.isNota ? (
            <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '0', color: '#333' }}>
              NOTA (None of the Above)
            </p>
          ) : winner.candidate ? (
            <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '0', color: '#333' }}>
              {winner.candidate.name}
            </p>
          ) : (
            <p style={{ fontSize: '16px', margin: '0', color: '#666' }}>No winner determined</p>
          )}
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#555' }}>
            <strong>{winner.votes}</strong> votes ({winner.percentage.toFixed(2)}%) • 
            Victory by <strong>{threshold.winnerType}</strong>
            {competitiveness.secondPlace && (
              <span> • Margin: <strong>{competitiveness.marginOfVictory} votes</strong></span>
            )}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginTop: '15px' }}>
          <div style={metricCardStyle}>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '5px' }}>
              <Users size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              Total Votes
            </div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#000' }}>
              {election.totalVotes || 0}
            </div>
          </div>
          
          <div style={metricCardStyle}>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '5px' }}>
              <TrendingUp size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              Voter Turnout
            </div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#4caf50' }}>
              {turnoutData?.voterTurnoutPercentage || 0}%
            </div>
          </div>
          
          <div style={metricCardStyle}>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '5px' }}>
              <BarChart3 size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              Race Type
            </div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ff9800' }}>
              {competitiveness.raceType}
            </div>
          </div>
          
          <div style={metricCardStyle}>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '5px' }}>
              <Clock size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              Peak Time
            </div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#2196f3' }}>
              {peakAnalysis.peakTime}
            </div>
          </div>
        </div>
      </div>

      {/* ELECTION DETAILS */}
      <div id="pdf-section-details" style={sectionStyle}>
        <h3 style={headingStyle}>Election Information</h3>
        <div style={cardStyle}>
          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px 0', fontWeight: 'bold', width: '40%' }}>Election Title:</td>
                <td style={{ padding: '8px 0' }}>{election.title}</td>
              </tr>
              {election.description && (
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Description:</td>
                  <td style={{ padding: '8px 0' }}>{election.description}</td>
                </tr>
              )}
              <tr>
                <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Branch/Section:</td>
                <td style={{ padding: '8px 0' }}>{election.branch.toUpperCase()} - {election.section.toUpperCase()}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Start Time:</td>
                <td style={{ padding: '8px 0' }}>{new Date(election.startTime).toLocaleString()}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontWeight: 'bold' }}>End Time:</td>
                <td style={{ padding: '8px 0' }}>{new Date(election.endTime).toLocaleString()}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Duration:</td>
                <td style={{ padding: '8px 0' }}>
                  {Math.round((new Date(election.endTime).getTime() - new Date(election.startTime).getTime()) / (1000 * 60))} minutes
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Total Candidates:</td>
                <td style={{ padding: '8px 0' }}>{election.candidates.length}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* RESULTS TABLE */}
      <div id="pdf-section-table" style={sectionStyle}>
        <h3 style={headingStyle}>Detailed Results</h3>
        <ResultsTable
          candidates={election.candidates}
          results={election.results}
          notaVotes={election.notaVotes || 0}
          theme="light"
        />
      </div>

      {/* COMPETITIVENESS ANALYSIS */}
      <div id="pdf-section-competitiveness" style={sectionStyle}>
        <h3 style={headingStyle}>Competitiveness Analysis</h3>
        <div style={cardStyle}>
          <div style={{ marginBottom: '15px' }}>
            <strong>Race Classification:</strong> {competitiveness.raceType}
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              {competitiveness.raceType === 'Landslide' && 'Clear victory with substantial margin'}
              {competitiveness.raceType === 'Decisive' && 'Strong victory with comfortable margin'}
              {competitiveness.raceType === 'Competitive' && 'Moderately close race with notable competition'}
              {competitiveness.raceType === 'Very Close' && 'Highly competitive race with narrow margin'}
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666' }}>Margin of Victory</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {competitiveness.marginOfVictory} votes ({competitiveness.marginPercentage.toFixed(2)}%)
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '12px', color: '#666' }}>Competitiveness Index</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {competitiveness.competitivenessIndex}/100
              </div>
            </div>
          </div>

          {competitiveness.secondPlace && (
            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ddd' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Runner-up</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                {competitiveness.secondPlace.name}
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>
                {competitiveness.secondPlace.votes} votes ({competitiveness.secondPlace.percentage.toFixed(2)}%)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* STATISTICAL ANALYSIS */}
      <div id="pdf-section-statistics" style={sectionStyle}>
        <h3 style={headingStyle}>Statistical Metrics</h3>
        <div style={cardStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666' }}>Mean Votes</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{statistics.mean}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666' }}>Median Votes</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{statistics.median}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666' }}>Std. Deviation</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{statistics.standardDeviation}</div>
            </div>
          </div>
        </div>
      </div>

      {/* PEAK VOTING ANALYSIS */}
      <div id="pdf-section-peak" style={sectionStyle}>
        <h3 style={headingStyle}>Peak Voting Analysis</h3>
        <div style={cardStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666' }}>Peak Voting Time</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2196f3' }}>
                {peakAnalysis.peakTime}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                {peakAnalysis.peakVotes} votes during peak minute
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '12px', color: '#666' }}>Average Votes/Minute</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {peakAnalysis.averageVotesPerMinute}
              </div>
            </div>
          </div>
          
          {peakAnalysis.firstVoteTime && peakAnalysis.lastVoteTime && (
            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ddd' }}>
              <div style={{ fontSize: '12px', color: '#666' }}>Voting Window</div>
              <div style={{ fontSize: '14px' }}>
                First vote: <strong>{peakAnalysis.firstVoteTime}</strong> • 
                Last vote: <strong>{peakAnalysis.lastVoteTime}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CHARTS */}
      <div id="pdf-section-pie" style={sectionStyle}>
        <h3 style={headingStyle}>Vote Distribution</h3>
        <ResultsChart
          candidates={election.candidates}
          results={election.results}
          notaVotes={election.notaVotes || 0}
          theme="light"
        />
      </div>
      
      {timelineData.length > 0 && (
        <div id="pdf-section-timeline" style={sectionStyle}>
          <h3 style={headingStyle}>Voting Timeline</h3>
          <VotingTimelineChart data={timelineData} theme="light" />
        </div>
      )}

      {turnoutData && (
        <div id="pdf-section-turnout" style={sectionStyle}>
          <h3 style={headingStyle}>Voter Turnout Analytics</h3>
          <VoterTurnoutAnalytics data={turnoutData} theme="light" />
        </div>
      )}

      {/* INSIGHTS & RECOMMENDATIONS */}
      {insights.length > 0 && (
        <div id="pdf-section-insights" style={sectionStyle}>
          <h3 style={headingStyle}>Key Insights</h3>
          <div style={cardStyle}>
            <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '13px', lineHeight: '1.8' }}>
              {insights.map((insight, idx) => (
                <li key={idx} style={{ marginBottom: '8px' }}>{insight}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <div id="pdf-section-recommendations" style={sectionStyle}>
          <h3 style={headingStyle}>Recommendations</h3>
          <div style={cardStyle}>
            <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '13px', lineHeight: '1.8' }}>
              {recommendations.map((rec, idx) => (
                <li key={idx} style={{ marginBottom: '8px' }}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* SECURITY & VERIFICATION */}
      <div id="pdf-section-security" style={sectionStyle}>
        <h3 style={headingStyle}>
          <Shield size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
          Security & Verification
        </h3>
        <div style={cardStyle}>
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Report Hash (Verification)</div>
            <div style={{ 
              fontFamily: 'monospace', 
              fontSize: '14px', 
              backgroundColor: '#f0f0f0', 
              padding: '8px', 
              borderRadius: '4px',
              fontWeight: 'bold'
            }}>
              {reportHash}
            </div>
          </div>

          <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
              <CheckCircle2 size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle', color: '#4caf50' }} />
              Security Features
            </h4>
            <ul style={{ margin: '0', paddingLeft: '20px' }}>
              <li>End-to-end encrypted vote transmission</li>
              <li>Cryptographic vote verification tickets</li>
              <li>Anonymized voter data with no traceable identifiers</li>
              <li>Secure authentication with multi-factor verification</li>
              <li>Real-time audit trail logging</li>
              <li>Tamper-evident result recording</li>
            </ul>
          </div>

          {qrCodeDataUrl && (
            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ddd', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                Scan to verify report authenticity
              </div>
              <img src={qrCodeDataUrl} alt="Verification QR Code" style={{ width: '100px', height: '100px' }} />
            </div>
          )}
        </div>
      </div>

      {/* CERTIFICATION */}
      <div id="pdf-section-certification" style={{ 
        ...sectionStyle,
        border: '2px solid #000',
        padding: '20px',
        marginTop: '30px'
      }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: 'bold', 
          textAlign: 'center', 
          marginBottom: '15px',
          textTransform: 'uppercase'
        }}>
          Official Certification
        </h3>
        <div style={{ fontSize: '12px', lineHeight: '1.8', textAlign: 'justify' }}>
          <p style={{ marginBottom: '10px' }}>
            This is an official election report generated by the VeriVote system. All data contained herein 
            has been securely recorded and verified through cryptographic methods. The results are final 
            and represent the authentic outcome of the election conducted on {new Date(election.endTime).toLocaleDateString()}.
          </p>
          <p style={{ marginBottom: '10px' }}>
            This report maintains complete voter anonymity while ensuring full verifiability of results. 
            No personally identifiable information has been included in this document.
          </p>
          
          <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <div style={{ borderTop: '1px solid #000', paddingTop: '5px', marginTop: '40px' }}>
                <div style={{ fontSize: '11px', color: '#666' }}>Election Officer Signature</div>
              </div>
            </div>
            <div>
              <div style={{ borderTop: '1px solid #000', paddingTop: '5px', marginTop: '40px' }}>
                <div style={{ fontSize: '11px', color: '#666' }}>Date</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER INFO */}
      <div style={{ 
        marginTop: '20px', 
        paddingTop: '15px', 
        borderTop: '1px solid #ddd',
        fontSize: '10px',
        color: '#666',
        textAlign: 'center'
      }}>
        <p style={{ margin: '5px 0' }}>
          Report ID: {reportId} | Generated: {new Date().toLocaleString()}
        </p>
        <p style={{ margin: '5px 0' }}>
          VeriVote - Secure, Transparent, and Anonymous Voting Platform
        </p>
        <p style={{ margin: '5px 0' }}>
          National Institute of Engineering, Mysore
        </p>
      </div>
    </div>
  );
};

export default EnhancedPrintableReport;
