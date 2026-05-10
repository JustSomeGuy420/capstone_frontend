import { api } from '../lib/api';

export type Question = {
  question_id: number;
  candidate_id?: number | null;
  job_id?: number | null;
  element_id: string;
  competency_name: string;
  directed_at: string;
  reason: string;
  question_text: string;
  answer_text: string | null;
  resolved: boolean;
};

export const questionService = {
  getMyQuestions: () => api.get<Question[]>('/questions/mine'),
  answerQuestion: (questionId: number, answerText: string) =>
    api.post<Question>(`/questions/${questionId}/answer`, { answer_text: answerText }),
};
