import { api } from '../lib/api';

export type Recommendation = {
  rank: number;
  match_id: number;
  job_id: number;
  employer_id: number;
  title: string;
  company_name: string;
  match_score: number;
  recommendation_score: number;
  qualification_tier: string;
  knockout_failed: boolean;
  explanation: string | null;
  gap_profile: {
    coverage: number;
    scored: Record<string, { name: string; gap: number; required_level: number; candidate_level: number }>;
    undetermined: Record<string, unknown>;
    absent: Record<string, unknown>;
  } | null;
};

export const matchService = {
  getRecommendations: (limit = 20) =>
    api.get<Recommendation[]>(`/matches/recommendations?limit=${limit}`),
  triggerCandidateMatching: () => api.post<{ status: string }>('/matches/trigger', {}),
  triggerJobMatching: (jobId: number) => api.post<{ status: string }>(`/matches/trigger/${jobId}`, {}),
  explainMatch: (matchId: number) =>
    api.get<{ match_id: number; explanation: string }>(`/matches/${matchId}/explain`),
};
