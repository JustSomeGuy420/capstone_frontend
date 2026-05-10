import { api } from '../lib/api';

export type PublicCandidateCompetency = {
  competency_name: string;
  category: string | null;
  level_score: number | null;
};

export type MatchForCandidateProfile = {
  match_id: number;
  job_id: number;
  job_title: string;
  match_score: number;
  coverage: number;
  job_score: number;
  qualification_tier: string;
  knockout_failed: boolean;
};

export type PublicCandidateProfile = {
  candidate_id: number;
  name: string;
  tech_keywords: string[];
  competencies: PublicCandidateCompetency[];
  matches: MatchForCandidateProfile[];
};

export type MatchForEmployerProfile = {
  match_id: number;
  match_score: number;
  recommendation_score: number;
  qualification_tier: string;
  knockout_failed: boolean;
};

export type PublicJobSummary = {
  job_id: number;
  title: string;
  is_active: boolean;
  created_at: string;
  match: MatchForEmployerProfile | null;
};

export type PublicEmployerProfile = {
  employer_id: number;
  company_name: string | null;
  jobs: PublicJobSummary[];
};

export const profileService = {
  getCandidateProfile: (candidateId: number) =>
    api.get<PublicCandidateProfile>(`/profiles/candidate/${candidateId}`),
  getCandidateResume: (candidateId: number) =>
    api.get<{ candidate_id: number; resume_text: string }>(`/profiles/candidate/${candidateId}/resume`),
  getEmployerProfile: (employerId: number) =>
    api.get<PublicEmployerProfile>(`/profiles/employer/${employerId}`),
};
