import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { PageHead } from '../../components/dashboard/PageHead';
import { Modal } from '../../components/dashboard/Modal';
import { Tier } from '../../components/dashboard/Tier';
import '../../styles/dashboard.css';

// ---- API shapes ----
type Job = {
  job_id: number;
  employer_id: number;
  title: string;
  description: string;
  created_at: string;
};

type CandidateRank = {
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

type Question = {
  question_id: number;
  job_id: number | null;
  element_id: string;
  competency_name: string;
  reason: string;
  question_text: string;
  answer_text: string | null;
  resolved: boolean;
};

type MeResponse = {
  employer_id?: number;
  company_name?: string;
};

// ---- Post job form ----
function PostJobForm({ onPost }: { onPost: (job: Job) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const job = await api.post<Job>('/jobs/', { title, description });
      onPost(job);
      setTitle('');
      setDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post job.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          <h2>Post a new job</h2>
          <div className="card-sub">We extract competencies from the description, then rank candidates in the background.</div>
        </div>
      </div>
      {error && <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>}
      <form className="stack-sm" onSubmit={handleSubmit}>
        <div className="field">
          <label>Job title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Senior Frontend Engineer" required />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Paste the full job description. Include required vs preferred competencies, must-have qualifications, and any knockout criteria."
            required
          />
          <span className="hint">Tip: phrase knockouts explicitly, e.g. &quot;Required: legal authorization to work in the US.&quot;</span>
        </div>
        <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
          <button className="btn primary" type="submit" disabled={submitting}>
            {submitting ? 'Posting...' : 'Post job'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---- Jobs list ----
function JobsList({ jobs, activeId, onSelect }: { jobs: Job[]; activeId: number | null; onSelect: (id: number) => void }) {
  return (
    <div className="stack-sm">
      {jobs.length === 0 && (
        <div className="uploaded-row">
          <div className="file-meta">
            <div className="file-name">No jobs posted yet</div>
            <div className="file-sub">Post your first role to start seeing ranked candidates.</div>
          </div>
        </div>
      )}
      {jobs.map(j => (
        <button
          key={j.job_id}
          className={`job-card ${activeId === j.job_id ? 'active' : ''}`}
          onClick={() => onSelect(j.job_id)}
          style={{ textAlign: 'left', width: '100%', border: 'none' }}
        >
          <h3>{j.title}</h3>
          <div className="job-meta">
            <span>Posted {j.created_at.slice(0, 10)}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

// ---- Rankings table ----
function Rankings({ rows, onExplain }: { rows: CandidateRank[]; onExplain: (r: CandidateRank) => void }) {
  if (rows.length === 0) {
    return (
      <div className="uploaded-row">
        <div className="file-meta">
          <div className="file-name">No candidates ranked yet</div>
          <div className="file-sub">Matching runs automatically when candidates upload resumes.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="candidates">
        <thead>
          <tr>
            <th>#</th>
            <th>Candidate</th>
            <th>Match</th>
            <th>Coverage</th>
            <th>Job score</th>
            <th>Tier</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.rank} className={r.knockout_failed ? 'knockout' : ''}>
              <td className="rank-cell">{r.rank}</td>
              <td>
                <span className="cand-name">{r.candidate_name}</span>
                {r.knockout_failed && <span className="knockout-label">Knockout failed</span>}
              </td>
              <td className="num">{r.match_score.toFixed(2)}</td>
              <td className="num">{r.coverage.toFixed(2)}</td>
              <td className="num"><strong>{r.job_score.toFixed(2)}</strong></td>
              <td><Tier value={r.qualification_tier} /></td>
              <td style={{ textAlign: 'right' }}>
                <button className="btn ghost sm" onClick={() => onExplain(r)}>Explain</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- Main dashboard ----
export default function RecruiterDashboard() {
  const { userName, userEmail, accountType } = useAuth();
  const [active, setActive] = useState('overview');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [rankings, setRankings] = useState<Record<number, CandidateRank[]>>({});
  const [activeJob, setActiveJob] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [explainOf, setExplainOf] = useState<CandidateRank | null>(null);
  const [companyName, setCompanyName] = useState('');

  const loadJobs = useCallback(async () => {
    try {
      const data = await api.get<Job[]>('/jobs/');
      setJobs(data);
      if (data.length > 0 && !activeJob) setActiveJob(data[0].job_id);
    } catch {
      // none
    }
  }, [activeJob]);

  const loadRankings = useCallback(async (jobId: number) => {
    try {
      const data = await api.get<CandidateRank[]>(`/matches/rankings?job_id=${jobId}`);
      setRankings(prev => ({ ...prev, [jobId]: data }));
    } catch {
      // none
    }
  }, []);

  useEffect(() => {
    api.get<MeResponse>('/users/me').then(me => {
      if (me.company_name) setCompanyName(me.company_name);
    }).catch(() => {});
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    if (activeJob && !rankings[activeJob]) loadRankings(activeJob);
  }, [activeJob, rankings, loadRankings]);

  const name = userName ?? 'Account';
  const email = userEmail ?? '';
  const firstName = name.split(' ')[0];
  const currentJob = jobs.find(j => j.job_id === activeJob);
  const currentRanks = activeJob ? (rankings[activeJob] ?? []) : [];
  const totalStrong = Object.values(rankings).flat().filter(r => r.qualification_tier === 'strong_fit' && !r.knockout_failed).length;

  function handleNewJob(job: Job) {
    setJobs(prev => [job, ...prev]);
    setActiveJob(job.job_id);
    setActive('jobs');
  }

  function handleSelectJob(id: number) {
    setActiveJob(id);
    if (!rankings[id]) loadRankings(id);
  }

  return (
    <div className="app-shell">
      <Sidebar
        active={active}
        onNavigate={setActive}
        accountType={accountType ?? 'recruiter'}
        name={name}
        email={email}
        counts={{ jobs: jobs.length, questions: questions.filter(q => !q.resolved).length }}
      />

      <main className="dash-main">
        {active === 'overview' && (
          <>
            <PageHead
              eyebrow={companyName ? `${companyName} · Hiring` : 'Hiring'}
              title={`Welcome back, ${firstName}.`}
              sub="Your open jobs and the strongest candidates ranked across them."
              actions={<button className="btn primary" onClick={() => setActive('post')}>Post a job</button>}
            />
            <div className="stack">
              <div className="stats-row">
                <div className="stat-block">
                  <div className="stat-label">Open jobs</div>
                  <div className="stat-value">{jobs.length}</div>
                  <div className="stat-sub">Across all roles</div>
                </div>
                <div className="stat-block">
                  <div className="stat-label">Total ranked</div>
                  <div className="stat-value">{Object.values(rankings).reduce((s, r) => s + r.length, 0)}</div>
                  <div className="stat-sub">Candidates across roles</div>
                </div>
                <div className="stat-block">
                  <div className="stat-label">Strong fits</div>
                  <div className="stat-value">{totalStrong}</div>
                  <div className="stat-sub">Top of every ranking</div>
                </div>
              </div>
              <div className="grid-2">
                <div className="card">
                  <div className="card-head">
                    <div className="card-title">
                      <h2>Recent jobs</h2>
                      <div className="card-sub">Click a role to see ranked candidates.</div>
                    </div>
                  </div>
                  <JobsList jobs={jobs} activeId={activeJob} onSelect={id => { handleSelectJob(id); setActive('jobs'); }} />
                </div>
                <div className="card">
                  <div className="card-head">
                    <div className="card-title">
                      <h2>Top of ranking</h2>
                      <div className="card-sub">{currentJob?.title ?? 'Select a job'}</div>
                    </div>
                  </div>
                  <Rankings rows={currentRanks.slice(0, 4)} onExplain={setExplainOf} />
                </div>
              </div>
            </div>
          </>
        )}

        {active === 'jobs' && (
          <>
            <PageHead
              eyebrow="Job postings"
              title={currentJob?.title ?? 'Jobs'}
              sub={currentJob ? `Posted ${currentJob.created_at.slice(0, 10)}` : ''}
              actions={
                <>
                  <button className="btn secondary" onClick={() => activeJob && loadRankings(activeJob)}>Re-run matching</button>
                </>
              }
            />
            <div className="grid-2">
              <JobsList jobs={jobs} activeId={activeJob} onSelect={handleSelectJob} />
              <div className="stack">
                {currentJob && (
                  <div className="card tight">
                    <div className="card-head" style={{ marginBottom: 8 }}>
                      <div className="card-title"><h2 style={{ fontSize: '1.1rem' }}>Description</h2></div>
                    </div>
                    <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--tm-fg-1)' }}>{currentJob.description}</p>
                  </div>
                )}
                <div className="card">
                  <div className="card-head">
                    <div className="card-title">
                      <h2>Ranked candidates</h2>
                      <div className="card-sub">job_score = match_score x coverage. Knockout-failed candidates are kept for context but visually muted.</div>
                    </div>
                  </div>
                  <Rankings rows={currentRanks} onExplain={setExplainOf} />
                </div>
              </div>
            </div>
          </>
        )}

        {active === 'post' && (
          <>
            <PageHead
              eyebrow="Create"
              title="Post a new role"
              sub="The matcher reads your description, extracts competencies, and ranks existing candidates within seconds."
            />
            <PostJobForm onPost={handleNewJob} />
          </>
        )}

        {active === 'questions' && (
          <>
            <PageHead
              eyebrow="Inbox"
              title="Clarifying questions"
              sub="When the system isn't sure how to weight a competency in your job description, it asks."
            />
            <div className="card">
              {questions.filter(q => !q.resolved).length === 0 ? (
                <div className="uploaded-row">
                  <div className="file-meta">
                    <div className="file-name">Inbox is clear</div>
                    <div className="file-sub">Questions appear here when a job competency is ambiguous.</div>
                  </div>
                </div>
              ) : (
                <div className="stack-sm">
                  {questions.filter(q => !q.resolved).map(q => (
                    <div className="question" key={q.question_id}>
                      <span className="question-reason">ambiguous requirement · {q.competency_name}</span>
                      <div className="question-text">{q.question_text}</div>
                      <textarea placeholder="Set the bar so we can rank correctly." />
                      <div className="question-foot">
                        <span className="question-ctx">Job {q.job_id} · Element {q.element_id}</span>
                        <button className="btn primary sm">Submit answer</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {explainOf && (
        <Modal
          title={`Why ${explainOf.candidate_name} ranked #${explainOf.rank}`}
          onClose={() => setExplainOf(null)}
          footer={<button className="btn ghost" onClick={() => setExplainOf(null)}>Close</button>}
        >
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <span className="score-chip">{Math.round(explainOf.match_score * 100)}% match</span>
            <Tier value={explainOf.qualification_tier} />
            {explainOf.knockout_failed && <span className="tier low">Knockout failed</span>}
          </div>
          <p style={{ lineHeight: 1.7, margin: '0 0 8px', color: 'var(--tm-fg-1)' }}>
            {explainOf.knockout_failed
              ? `${explainOf.candidate_name} scored ${(explainOf.match_score * 100).toFixed(0)}% on overlapping competencies but failed a hard-required qualification, so this candidate is excluded from your shortlist. The job_score of ${explainOf.job_score.toFixed(2)} reflects the coverage penalty.`
              : `${explainOf.candidate_name} covers ${(explainOf.coverage * 100).toFixed(0)}% of the role's competencies at or above the required level. Their match score of ${explainOf.match_score.toFixed(2)} weighted by coverage gives a job_score of ${explainOf.job_score.toFixed(2)}.`}
          </p>
        </Modal>
      )}
    </div>
  );
}
