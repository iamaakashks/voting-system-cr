import { Election, Candidate } from '../types';
import { TimelineData, TurnoutData } from '../services/api';

export interface WinnerInfo {
  candidate: Candidate | null;
  votes: number;
  percentage: number;
  isNota: boolean;
}

export interface CompetitivenessMetrics {
  marginOfVictory: number;
  marginPercentage: number;
  competitivenessIndex: number; // 0-100, higher = more competitive
  raceType: 'Landslide' | 'Decisive' | 'Competitive' | 'Very Close';
  secondPlace: {
    name: string;
    votes: number;
    percentage: number;
  } | null;
}

export interface PeakVotingAnalysis {
  peakTime: string;
  peakVotes: number;
  averageVotesPerMinute: number;
  totalDurationMinutes: number;
  firstVoteTime: string | null;
  lastVoteTime: string | null;
}

export interface StatisticalMetrics {
  mean: number;
  median: number;
  standardDeviation: number;
  variance: number;
  coefficientOfVariation: number;
}

export interface ThresholdAnalysis {
  hasMajority: boolean;
  majorityThreshold: number;
  winnerType: 'Majority' | 'Plurality';
  votesNeededForMajority: number;
}

/**
 * Determine the winner of the election
 */
export const getWinner = (election: Election): WinnerInfo => {
  let maxVotes = 0;
  let winner: Candidate | null = null;
  let isNota = false;

  // Check candidates
  election.candidates.forEach(candidate => {
    const votes = election.results[candidate.id] || 0;
    if (votes > maxVotes) {
      maxVotes = votes;
      winner = candidate;
      isNota = false;
    }
  });

  // Check NOTA
  const notaVotes = election.notaVotes || 0;
  if (notaVotes > maxVotes) {
    maxVotes = notaVotes;
    winner = null;
    isNota = true;
  }

  const totalVotes = election.totalVotes || 0;
  const percentage = totalVotes > 0 ? (maxVotes / totalVotes) * 100 : 0;

  return {
    candidate: winner,
    votes: maxVotes,
    percentage,
    isNota
  };
};

/**
 * Calculate competitiveness metrics
 */
export const getCompetitivenessMetrics = (election: Election): CompetitivenessMetrics => {
  const allResults: Array<{ name: string; votes: number }> = [];

  // Add candidates
  election.candidates.forEach(c => {
    allResults.push({
      name: c.name,
      votes: election.results[c.id] || 0
    });
  });

  // Add NOTA
  if (election.notaVotes !== undefined) {
    allResults.push({
      name: 'NOTA',
      votes: election.notaVotes
    });
  }

  // Sort by votes descending
  allResults.sort((a, b) => b.votes - a.votes);

  const totalVotes = election.totalVotes || 0;
  const firstPlace = allResults[0];
  const secondPlace = allResults[1] || null;

  const marginOfVictory = secondPlace ? firstPlace.votes - secondPlace.votes : firstPlace.votes;
  const marginPercentage = totalVotes > 0 ? (marginOfVictory / totalVotes) * 100 : 0;

  // Competitiveness index: 100 = dead heat, 0 = complete dominance
  let competitivenessIndex = 0;
  if (secondPlace && totalVotes > 0) {
    const ratio = secondPlace.votes / firstPlace.votes;
    competitivenessIndex = Math.round(ratio * 100);
  }

  // Determine race type
  let raceType: 'Landslide' | 'Decisive' | 'Competitive' | 'Very Close';
  if (marginPercentage > 30) {
    raceType = 'Landslide';
  } else if (marginPercentage > 15) {
    raceType = 'Decisive';
  } else if (marginPercentage > 5) {
    raceType = 'Competitive';
  } else {
    raceType = 'Very Close';
  }

  return {
    marginOfVictory,
    marginPercentage,
    competitivenessIndex,
    raceType,
    secondPlace: secondPlace ? {
      name: secondPlace.name,
      votes: secondPlace.votes,
      percentage: totalVotes > 0 ? (secondPlace.votes / totalVotes) * 100 : 0
    } : null
  };
};

/**
 * Analyze peak voting times
 */
export const getPeakVotingAnalysis = (timelineData: TimelineData[]): PeakVotingAnalysis => {
  if (!timelineData || timelineData.length === 0) {
    return {
      peakTime: 'N/A',
      peakVotes: 0,
      averageVotesPerMinute: 0,
      totalDurationMinutes: 0,
      firstVoteTime: null,
      lastVoteTime: null
    };
  }

  // Find peak
  let peakEntry = timelineData[0];
  timelineData.forEach(entry => {
    if (entry.votes > peakEntry.votes) {
      peakEntry = entry;
    }
  });

  const totalVotes = timelineData.reduce((sum, entry) => sum + entry.votes, 0);
  const averageVotesPerMinute = totalVotes / timelineData.length;

  const firstTime = new Date(timelineData[0].time);
  const lastTime = new Date(timelineData[timelineData.length - 1].time);
  const durationMs = lastTime.getTime() - firstTime.getTime();
  const durationMinutes = Math.round(durationMs / (1000 * 60));

  return {
    peakTime: new Date(peakEntry.time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }),
    peakVotes: peakEntry.votes,
    averageVotesPerMinute: Math.round(averageVotesPerMinute * 10) / 10,
    totalDurationMinutes: durationMinutes,
    firstVoteTime: firstTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }),
    lastVoteTime: lastTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  };
};

/**
 * Calculate statistical metrics for vote distribution
 */
export const getStatisticalMetrics = (election: Election): StatisticalMetrics => {
  const votes: number[] = [];

  election.candidates.forEach(c => {
    votes.push(election.results[c.id] || 0);
  });

  if (election.notaVotes !== undefined) {
    votes.push(election.notaVotes);
  }

  if (votes.length === 0) {
    return {
      mean: 0,
      median: 0,
      standardDeviation: 0,
      variance: 0,
      coefficientOfVariation: 0
    };
  }

  // Mean
  const mean = votes.reduce((sum, v) => sum + v, 0) / votes.length;

  // Median
  const sortedVotes = [...votes].sort((a, b) => a - b);
  const mid = Math.floor(sortedVotes.length / 2);
  const median = sortedVotes.length % 2 === 0
    ? (sortedVotes[mid - 1] + sortedVotes[mid]) / 2
    : sortedVotes[mid];

  // Variance and Standard Deviation
  const variance = votes.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / votes.length;
  const standardDeviation = Math.sqrt(variance);

  // Coefficient of Variation
  const coefficientOfVariation = mean !== 0 ? (standardDeviation / mean) * 100 : 0;

  return {
    mean: Math.round(mean * 10) / 10,
    median: Math.round(median * 10) / 10,
    standardDeviation: Math.round(standardDeviation * 10) / 10,
    variance: Math.round(variance * 10) / 10,
    coefficientOfVariation: Math.round(coefficientOfVariation * 10) / 10
  };
};

/**
 * Analyze threshold (majority vs plurality)
 */
export const getThresholdAnalysis = (election: Election): ThresholdAnalysis => {
  const totalVotes = election.totalVotes || 0;
  const majorityThreshold = Math.ceil(totalVotes / 2);

  const winner = getWinner(election);
  const hasMajority = winner.votes >= majorityThreshold;

  return {
    hasMajority,
    majorityThreshold,
    winnerType: hasMajority ? 'Majority' : 'Plurality',
    votesNeededForMajority: hasMajority ? 0 : majorityThreshold - winner.votes
  };
};

/**
 * Generate a unique report ID
 */
export const generateReportId = (election: Election): string => {
  const date = new Date(election.endTime);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const electionIdShort = election.id.substring(0, 8);
  
  return `ELECT-${year}${month}${day}-${electionIdShort.toUpperCase()}`;
};

/**
 * Generate report hash for verification
 */
export const generateReportHash = (election: Election): string => {
  const data = JSON.stringify({
    id: election.id,
    title: election.title,
    results: election.results,
    totalVotes: election.totalVotes,
    timestamp: Date.now()
  });
  
  // Simple hash function (in production, use crypto library)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
};

/**
 * Generate insights and recommendations
 */
export const generateInsights = (
  election: Election,
  turnoutData: TurnoutData | null,
  competitiveness: CompetitivenessMetrics,
  peakAnalysis: PeakVotingAnalysis
): string[] => {
  const insights: string[] = [];
  
  // Turnout insights
  if (turnoutData) {
    const turnout = turnoutData.voterTurnoutPercentage;
    if (turnout >= 80) {
      insights.push(`Excellent voter turnout of ${turnout}% indicates strong engagement and interest in this election.`);
    } else if (turnout >= 60) {
      insights.push(`Good voter turnout of ${turnout}% demonstrates satisfactory participation levels.`);
    } else if (turnout >= 40) {
      insights.push(`Moderate turnout of ${turnout}% suggests room for improvement in voter engagement strategies.`);
    } else {
      insights.push(`Low turnout of ${turnout}% indicates potential barriers to participation that should be addressed.`);
    }
  }
  
  // Competitiveness insights
  if (competitiveness.raceType === 'Very Close') {
    insights.push(`This was a highly competitive race with only a ${competitiveness.marginPercentage.toFixed(1)}% margin, indicating diverse voter preferences.`);
  } else if (competitiveness.raceType === 'Landslide') {
    insights.push(`The decisive ${competitiveness.marginPercentage.toFixed(1)}% margin suggests strong consensus among voters.`);
  }
  
  // Peak voting insights
  if (peakAnalysis.peakVotes > 0) {
    insights.push(`Peak voting occurred at ${peakAnalysis.peakTime}, indicating the most convenient time for voter participation.`);
  }
  
  // NOTA insights
  const notaVotes = election.notaVotes || 0;
  if (notaVotes > 0 && election.totalVotes) {
    const notaPercentage = (notaVotes / election.totalVotes) * 100;
    if (notaPercentage > 10) {
      insights.push(`${notaPercentage.toFixed(1)}% of voters chose NOTA, suggesting some dissatisfaction with available candidates.`);
    }
  }
  
  return insights;
};

/**
 * Generate recommendations for future elections
 */
export const generateRecommendations = (
  turnoutData: TurnoutData | null,
  peakAnalysis: PeakVotingAnalysis
): string[] => {
  const recommendations: string[] = [];
  
  if (turnoutData && turnoutData.voterTurnoutPercentage < 70) {
    recommendations.push('Consider extending voting hours or implementing reminder notifications to improve turnout.');
  }
  
  if (peakAnalysis.peakVotes > 0) {
    recommendations.push(`Schedule future elections during similar time windows (around ${peakAnalysis.peakTime}) for optimal participation.`);
  }
  
  recommendations.push('Maintain the current security measures and anonymity protections for voter confidence.');
  recommendations.push('Continue using digital platforms to ensure accessibility and convenience for all eligible voters.');
  
  return recommendations;
};
