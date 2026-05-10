import { api } from '../lib/api';

export type ResumeResponse = {
  resume_id: number;
  candidate_id: number;
  upload_date: string;
};

export const resumeService = {
  getMyResume: () => api.get<ResumeResponse | null>('/resumes/me'),
  deleteResume: (resumeId: number) => api.delete<{ message: string }>(`/resumes/${resumeId}`),
  uploadResume: async (file: File): Promise<ResumeResponse> => {
    const form = new FormData();
    form.append('file', file);
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${import.meta.env.VITE_API_URL}/resumes/`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail ?? `Upload failed (${res.status})`);
    }
    return res.json();
  },
};
