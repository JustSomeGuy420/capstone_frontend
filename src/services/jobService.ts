import { api } from '../lib/api';

export type Job = {
  job_id: number;
  employer_id: number;
  title: string;
  description: string;
  is_active: boolean;
  created_at: string;
};

export type CandidateRank = {
  rank: number;
  match_id: number;
  candidate_id: number;
  candidate_name: string;
  match_score: number;
  coverage: number;
  job_score: number;
  qualification_tier: string;
  knockout_failed: boolean;
};

export const jobService = {
  listJobs: () => api.get<Job[]>('/jobs/'),
  getJob: (jobId: number) => api.get<Job>(`/jobs/${jobId}`),
  createJob: (data: { title: string; description: string }) => api.post<Job>('/jobs/', data),
  updateJob: (jobId: number, data: { title?: string; description?: string }) =>
    api.put<Job>(`/jobs/${jobId}`, data),
  deleteJob: (jobId: number) => api.delete<{ message: string }>(`/jobs/${jobId}`),
  setJobStatus: (jobId: number, is_active: boolean) =>
    api.patch<Job>(`/jobs/${jobId}/status`, { is_active }),
  getRankings: (jobId: number, limit = 50) =>
    api.get<CandidateRank[]>(`/jobs/${jobId}/rankings?limit=${limit}`),
};
