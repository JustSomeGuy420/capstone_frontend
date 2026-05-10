import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { PageHead } from '../../components/dashboard/PageHead';
import { Modal } from '../../components/dashboard/Modal';
import { Tier } from '../../components/dashboard/Tier';
import { IconUpload } from '../../components/dashboard/Icons';
import '../../styles/dashboard.css';

// ---- API shapes ----
type Competency = {
  competency_id: number;
  competency_name: string;
  category: string | null;
  level_score: number | null;
};

type CandidateProfile = {
  candidate_id: number;
  tech_keywords: string[];
  competencies: Competency[];
};

type Recommendation = {
  rank: number;
  match_id: number;
  job_id: number;
  title: string;
  company_name: string;
  match_score: number;
  recommendation_score: number;
  qualification_tier: string;
  knockout_failed: boolean;
  explanation: string | null;
  gap_profile: Record<string, { gap: number; required_level: number; candidate_level: number }> | null;
};

type Question = {
  question_id: number;
  element_id: string;
  competency_name: string;
  reason: string;
  question_text: string;
  answer_text: string | null;
  resolved: boolean;
};

type ResumeResponse = {
  resume_id: number;
  candidate_id: number;
  upload_date: string;
};

type MeResponse = {
  candidate_id?: number;
};

// ---- Competency chart ----
function CompetencyChart({ competencies }: { competencies: Competency[] }) {
  const byCategory = competencies.reduce<Record<string, Competency[]>>((acc, c) => {
    const cat = c.category ?? 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(c);
    return acc;
  }, {});

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          <h2>Competencies by category</h2>
          <div className="card-sub">Scored 0–100 from your resume. Categories follow the O*NET taxonomy.</div>
        </div>
      </div>
      {Object.keys(byCategory).length === 0 ? (
        <div className="uploaded-row">
          <div className="file-meta">
            <div className="file-name">No competencies scored yet</div>
            <div className="file-sub">Upload your resume to generate a competency profile.</div>
          </div>
        </div>
      ) : (
        <div className="chart-grid">
          {Object.entries(byCategory).map(([cat, items]) => (
            <div className="chart-cat" key={cat}>
              <h4>{cat}</h4>
              {items.slice(0, 6).map(c => (
                <div className="bar-row" key={c.competency_id}>
                  <div className="bar-label" title={c.competency_name}>{c.competency_name}</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${Math.round((c.level_score ?? 0))}%` }} />
                  </div>
                  <div className="bar-value">{((c.level_score ?? 0) / 100).toFixed(2)}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Resume upload ----
function ResumeUpload({ onUploaded }: { onUploaded: () => void }) {
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [uploadDate, setUploadDate] = useState<string | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [error, setError] = useState('');

  // Check on mount if the user already has a resume
  useEffect(() => {
    api.get<ResumeResponse>('/resumes/me').then(r => {
      setUploadDate(r.upload_date.slice(0, 10));
    }).catch(() => {
      // no resume yet
    });
  }, []);

  // Poll for scored competencies after upload, then fire onUploaded
  useEffect(() => {
    if (!scoring) return;
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const profile = await api.get<CandidateProfile>('/users/me/competencies');
        if (profile.competencies.length > 0) {
          clearInterval(interval);
          setScoring(false);
          onUploaded();
        }
      } catch {
        // not ready yet
      }
      if (attempts >= 20) {
        clearInterval(interval);
        setScoring(false);
        onUploaded();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [scoring, onUploaded]);

  async function handleFile(file: File) {
    if (!file) return;
    setUploading(true);
    setError('');
    const form = new FormData();
    form.append('file', file);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/resumes/`,
        { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? `Upload failed (${res.status})`);
      }
      const data: ResumeResponse = await res.json();
      setUploadDate(data.upload_date.slice(0, 10));
      setReplacing(false);
      setScoring(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  // Resume exists and not actively scoring or replacing
  if (uploadDate && !scoring && !replacing) {
    return (
      <div className="card">
        <div className="card-head">
          <div className="card-title">
            <h2>Resume</h2>
            <div className="card-sub">Your resume is on file and has been scored.</div>
          </div>
          <button className="btn secondary sm" onClick={() => setReplacing(true)}>Replace file</button>
        </div>
        <div className="uploaded-row">
          <span className="file-ico">PDF</span>
          <div className="file-meta">
            <div className="file-name">Resume on file</div>
            <div className="file-sub">Uploaded {uploadDate}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          <h2>Resume</h2>
          <div className="card-sub">PDF or Word, up to 10 MB. We'll score your competencies and match jobs automatically.</div>
        </div>
        {replacing && <button className="btn ghost sm" onClick={() => setReplacing(false)}>Cancel</button>}
      </div>

      {error && <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>}

      {scoring ? (
        <div className="uploaded-row loading-pulse">
          <span className="file-ico">PDF</span>
          <div className="file-meta">
            <div className="file-name">Scoring competencies...</div>
            <div className="file-sub">Usually 10–30 seconds. Your matches will update automatically when done.</div>
          </div>
        </div>
      ) : (
        <div
          className={`dropzone ${drag ? 'dragging' : ''}`}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onClick={() => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.pdf,.doc,.docx'; inp.onchange = () => { if (inp.files?.[0]) handleFile(inp.files[0]); }; inp.click(); }}
        >
          <span className="dropzone-ico"><IconUpload /></span>
          <h3>Drop your resume here</h3>
          <p>PDF or Word (.docx). We extract competencies, not raw text.</p>
          <button className="btn primary sm" disabled={uploading} onClick={e => e.stopPropagation()}>
            {uploading ? 'Uploading...' : 'Choose a file'}
          </button>
        </div>
      )}
    </div>
  );
}

// ---- Recommendations ----
function Recommendations({ recs, onExplain }: { recs: Recommendation[]; onExplain: (r: Recommendation) => void }) {
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          <h2>Top job matches</h2>
          <div className="card-sub">Ranked by combined fit and coverage. Click to see the per-role breakdown.</div>
        </div>
      </div>
      {recs.length === 0 ? (
        <div className="uploaded-row">
          <div className="file-meta">
            <div className="file-name">No recommendations yet</div>
            <div className="file-sub">Upload your resume to generate ranked job matches.</div>
          </div>
        </div>
      ) : (
        <div className="match-list">
          {recs.map(r => (
            <div className="match-row" key={r.match_id}>
              <div className="match-rank">{r.rank}</div>
              <div className="match-info">
                <h3>{r.title}</h3>
                <div className="match-meta">
                  <span>{r.company_name}</span>
                  <span className="dot" />
                  <Tier value={r.qualification_tier} />
                  <span className="dot" />
                  <span className="score-chip">{Math.round(r.match_score * 100)}%</span>
                </div>
              </div>
              <div className="match-actions">
                <button className="btn secondary sm" onClick={() => onExplain(r)}>Explain this match</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Clarifying questions ----
function ClarifyingQuestions({ items, onAnswer }: { items: Question[]; onAnswer: (id: number) => void }) {
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          <h2>Clarifying questions</h2>
          <div className="card-sub">When the matcher is uncertain about a competency, it asks. Your answer re-scores and re-runs matching.</div>
        </div>
      </div>
      <div className="stack-sm">
        {items.length === 0 && (
          <div className="uploaded-row">
            <div className="file-meta">
              <div className="file-name">Inbox is clear</div>
              <div className="file-sub">We'll ask if a competency needs clarifying.</div>
            </div>
          </div>
        )}
        {items.map(q => <QuestionCard key={q.question_id} q={q} onAnswer={onAnswer} />)}
      </div>
    </div>
  );
}

function QuestionCard({ q, onAnswer }: { q: Question; onAnswer: (id: number) => void }) {
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await api.post(`/questions/${q.question_id}/answer`, { answer_text: answer });
      onAnswer(q.question_id);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="question">
      <span className="question-reason">{q.reason} · {q.competency_name}</span>
      <div className="question-text">{q.question_text}</div>
      <textarea
        placeholder="Plain-language answer. The model scores it and updates your profile."
        value={answer}
        onChange={e => setAnswer(e.target.value)}
      />
      <div className="question-foot">
        <span className="question-ctx">Element {q.element_id}</span>
        <button className="btn primary sm" disabled={!answer || submitting} onClick={handleSubmit}>
          {submitting ? 'Submitting...' : 'Submit answer'}
        </button>
      </div>
    </div>
  );
}

// ---- Main dashboard ----
export default function ApplicantDashboard() {
  const { userName, userEmail, accountType } = useAuth();
  const [active, setActive] = useState('overview');
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [explainOf, setExplainOf] = useState<Recommendation | null>(null);
  const [candidateId, setCandidateId] = useState<number | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const data = await api.get<CandidateProfile>('/users/me/competencies');
      setProfile(data);
    } catch {
      // no profile yet
    }
  }, []);

  const loadRecs = useCallback(async () => {
    if (!candidateId) return;
    try {
      const data = await api.get<Recommendation[]>(`/matches/recommendations`);
      setRecs(data);
    } catch {
      // no recs yet
    }
  }, [candidateId]);

  const loadQuestions = useCallback(async () => {
    if (!candidateId) return;
    try {
      const data = await api.get<Question[]>(`/questions/mine`);
      setQuestions(data.filter(q => !q.resolved));
    } catch {
      // none
    }
  }, [candidateId]);

  useEffect(() => {
    api.get<MeResponse>('/users/me').then(me => {
      if (me.candidate_id) setCandidateId(me.candidate_id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (candidateId) {
      loadRecs();
      loadQuestions();
    }
  }, [candidateId, loadRecs, loadQuestions]);

  const name = userName ?? 'Account';
  const email = userEmail ?? '';
  const firstName = name.split(' ')[0];

  return (
    <div className="app-shell">
      <Sidebar
        active={active}
        onNavigate={setActive}
        accountType={accountType ?? 'applicant'}
        name={name}
        email={email}
        counts={{ recs: recs.length, questions: questions.length }}
      />

      <main className="dash-main">
        {active === 'overview' && (
          <>
            <PageHead
              eyebrow={`Welcome back, ${firstName}`}
              title="Your matches at a glance."
              sub="Upload your resume, review ranked recommendations, and answer clarifying questions to tighten your scores."
            />
            <div className="stack">
              <div className="stats-row">
                <div className="stat-block">
                  <div className="stat-label">Top match score</div>
                  <div className="stat-value">{recs[0] ? `${Math.round(recs[0].match_score * 100)}%` : '--'}</div>
                  <div className="stat-sub">{recs[0]?.title ?? 'No matches yet'}</div>
                </div>
                <div className="stat-block">
                  <div className="stat-label">Recommendations</div>
                  <div className="stat-value">{recs.length}</div>
                  <div className="stat-sub">{recs.filter(r => r.qualification_tier === 'strong_fit').length} strong fit</div>
                </div>
                <div className="stat-block">
                  <div className="stat-label">Open questions</div>
                  <div className="stat-value">{questions.length}</div>
                  <div className="stat-sub">Answer to refresh ranks</div>
                </div>
              </div>
              <ResumeUpload onUploaded={() => { loadProfile(); loadRecs(); }} />
              <Recommendations recs={recs.slice(0, 3)} onExplain={setExplainOf} />
            </div>
          </>
        )}

        {active === 'recommendations' && (
          <>
            <PageHead
              eyebrow="Job matches"
              title="All recommendations"
              sub="Ranked by fit score weighted by competency coverage."
              actions={<button className="btn secondary" onClick={loadRecs}>Re-run matching</button>}
            />
            <Recommendations recs={recs} onExplain={setExplainOf} />
          </>
        )}

        {active === 'competencies' && (
          <>
            <PageHead
              eyebrow="Your scored profile"
              title="Competencies"
              sub="From your most recent resume. Update by re-uploading or by answering clarifying questions."
            />
            <CompetencyChart competencies={profile?.competencies ?? []} />
          </>
        )}

        {active === 'questions' && (
          <>
            <PageHead
              eyebrow="Inbox"
              title="Clarifying questions"
              sub="The matcher asks when a competency level is uncertain. Your answer updates your profile."
            />
            <ClarifyingQuestions
              items={questions}
              onAnswer={id => setQuestions(qs => qs.filter(q => q.question_id !== id))}
            />
          </>
        )}
      </main>

      {explainOf && (
        <Modal
          title={`Why this matches — ${explainOf.title}`}
          onClose={() => setExplainOf(null)}
          footer={
            <>
              <button className="btn ghost" onClick={() => setExplainOf(null)}>Close</button>
            </>
          }
        >
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="score-chip">{Math.round(explainOf.match_score * 100)}% match</span>
            <Tier value={explainOf.qualification_tier} />
            <span style={{ color: 'var(--tm-fg-muted)', fontSize: 13 }}>{explainOf.company_name}</span>
          </div>
          <p style={{ lineHeight: 1.7, color: 'var(--tm-fg-1)', margin: '0 0 14px' }}>
            {explainOf.explanation ?? 'No explanation available yet.'}
          </p>
          {explainOf.gap_profile && Object.keys(explainOf.gap_profile).length > 0 && (
            <div className="chart-cat" style={{ padding: 14 }}>
              <h4>Gaps detected</h4>
              {Object.entries(explainOf.gap_profile).map(([k, v]) => (
                <div className="bar-row" key={k}>
                  <div className="bar-label">{k}</div>
                  <div className="bar-track">
                    <div className="bar-fill gap" style={{ width: `${Math.round(v.candidate_level * 100)}%` }} />
                  </div>
                  <div className="bar-value">-{v.gap.toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
