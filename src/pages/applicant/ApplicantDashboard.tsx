import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { userService } from '../../services/userService';
import { resumeService, type ResumeResponse } from '../../services/resumeService';
import { matchService, type Recommendation } from '../../services/matchService';
import { questionService, type Question } from '../../services/questionService';
import { profileService } from '../../services/profileService';
import { jobService, type Job } from '../../services/jobService';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { PageHead } from '../../components/dashboard/PageHead';
import { Modal } from '../../components/dashboard/Modal';
import { Tier } from '../../components/dashboard/Tier';
import { IconUpload } from '../../components/dashboard/Icons';
import '../../styles/dashboard.css';

// ---- Competency types (local only, sourced from userService endpoint) ----
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
                    <div className="bar-fill" style={{ width: `${Math.round(c.level_score ?? 0)}%` }} />
                  </div>
                  <div className="bar-value">{Math.round(c.level_score ?? 0)}</div>
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

  useEffect(() => {
    resumeService.getMyResume().then(r => {
      if (r) setUploadDate(r.upload_date.slice(0, 10));
    }).catch(() => {});
  }, []);

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
    try {
      const data = await resumeService.uploadResume(file);
      setUploadDate(data.upload_date.slice(0, 10));
      setReplacing(false);
      setScoring(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

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
function Recommendations({
  recs,
  onViewJob,
  onExplain,
}: {
  recs: Recommendation[];
  onViewJob: (r: Recommendation) => void;
  onExplain: (r: Recommendation) => void;
}) {
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          <h2>Top job matches</h2>
          <div className="card-sub">Ranked by combined fit and coverage. Click a job title to view its details.</div>
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
                <button
                  className="btn ghost sm"
                  style={{ padding: '2px 4px', fontWeight: 800, fontSize: '1rem', textAlign: 'left' }}
                  onClick={() => onViewJob(r)}
                >
                  {r.title}
                </button>
                <div className="match-meta">
                  <span style={{ color: 'var(--tm-fg-muted)', fontSize: 13 }}>{r.company_name}</span>
                  <span className="dot" />
                  <Tier value={r.qualification_tier} />
                  <span className="dot" />
                  <span className="score-chip">{Math.round(r.recommendation_score * 100)}%</span>
                </div>
              </div>
              <div className="match-actions">
                <button className="btn secondary sm" onClick={() => onExplain(r)}>Explain</button>
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
      await questionService.answerQuestion(q.question_id, answer);
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

// ---- Settings ----
function Settings({
  userId,
  initialFName,
  initialLName,
  initialEmail,
  onAccountDeleted,
}: {
  userId: number;
  initialFName: string;
  initialLName: string;
  initialEmail: string;
  onAccountDeleted: () => void;
}) {
  const [fName, setFName] = useState(initialFName);
  const [lName, setLName] = useState(initialLName);
  const [email, setEmail] = useState(initialEmail);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [myResume, setMyResume] = useState<ResumeResponse | null>(null);
  const [deletingResume, setDeletingResume] = useState(false);

  useEffect(() => {
    resumeService.getMyResume().then(r => setMyResume(r)).catch(() => {});
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg('');
    setProfileError('');
    try {
      await userService.updateUser(userId, { f_name: fName, l_name: lName, email });
      setProfileMsg('Profile updated.');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match.'); return; }
    setSavingPassword(true);
    setPasswordMsg('');
    setPasswordError('');
    try {
      await userService.changePassword(oldPassword, newPassword);
      setPasswordMsg('Password changed.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleDeleteResume() {
    if (!myResume) return;
    if (!confirm('Delete your resume? This will remove your competency scores and match data.')) return;
    setDeletingResume(true);
    try {
      await resumeService.deleteResume(myResume.resume_id);
      setMyResume(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete resume.');
    } finally {
      setDeletingResume(false);
    }
  }

  async function handleDeleteAccount() {
    if (!confirm('Permanently delete your account? This cannot be undone.')) return;
    try {
      await userService.deleteUser(userId);
      onAccountDeleted();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete account.');
    }
  }

  return (
    <div className="stack">
      <div className="card">
        <div className="card-head">
          <div className="card-title">
            <h2>Profile</h2>
            <div className="card-sub">Update your name and email address.</div>
          </div>
        </div>
        <form className="stack-sm" onSubmit={handleSaveProfile}>
          <div className="grid-2">
            <div className="field">
              <label>First name</label>
              <input value={fName} onChange={e => setFName(e.target.value)} required />
            </div>
            <div className="field">
              <label>Last name</label>
              <input value={lName} onChange={e => setLName(e.target.value)} required />
            </div>
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          {profileError && <p className="form-error">{profileError}</p>}
          {profileMsg && <p style={{ color: 'var(--tm-tier-strong)', fontWeight: 600 }}>{profileMsg}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn primary sm" type="submit" disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">
            <h2>Password</h2>
            <div className="card-sub">Leave blank to keep your current password.</div>
          </div>
        </div>
        <form className="stack-sm" onSubmit={handleChangePassword}>
          <div className="field">
            <label>Current password</label>
            <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
          </div>
          <div className="field">
            <label>New password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
          </div>
          <div className="field">
            <label>Confirm new password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          </div>
          {passwordError && <p className="form-error">{passwordError}</p>}
          {passwordMsg && <p style={{ color: 'var(--tm-tier-strong)', fontWeight: 600 }}>{passwordMsg}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn primary sm"
              type="submit"
              disabled={savingPassword || !oldPassword || !newPassword || newPassword !== confirmPassword}
            >
              {savingPassword ? 'Changing...' : 'Change password'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">
            <h2>Resume</h2>
            <div className="card-sub">Deleting your resume removes your competency scores and all match data.</div>
          </div>
        </div>
        {myResume ? (
          <div className="uploaded-row">
            <span className="file-ico">PDF</span>
            <div className="file-meta">
              <div className="file-name">Resume on file</div>
              <div className="file-sub">Uploaded {myResume.upload_date.slice(0, 10)}</div>
            </div>
            <button
              className="btn danger sm"
              onClick={handleDeleteResume}
              disabled={deletingResume}
            >
              {deletingResume ? 'Deleting...' : 'Delete resume'}
            </button>
          </div>
        ) : (
          <div className="uploaded-row">
            <div className="file-meta">
              <div className="file-name">No resume on file</div>
              <div className="file-sub">Go to Overview to upload one.</div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">
            <h2>Danger zone</h2>
            <div className="card-sub">Permanently deletes your account and all associated data.</div>
          </div>
        </div>
        <button className="btn danger sm" onClick={handleDeleteAccount}>Delete account</button>
      </div>
    </div>
  );
}

// ---- Main dashboard ----
export default function ApplicantDashboard() {
  const { userName, userEmail, accountType, signOutUser } = useAuth();
  const [active, setActive] = useState('overview');
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [candidateId, setCandidateId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [userFName, setUserFName] = useState('');
  const [userLName, setUserLName] = useState('');
  const [userEmail2, setUserEmail2] = useState('');

  // Explain modal
  const [explainOf, setExplainOf] = useState<Recommendation | null>(null);
  const [explanationText, setExplanationText] = useState<string | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);

  // Job detail modal
  const [viewingJob, setViewingJob] = useState<Recommendation | null>(null);
  const [jobDetail, setJobDetail] = useState<Job | null>(null);
  const [jobDetailLoading, setJobDetailLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const data = await api.get<CandidateProfile>('/users/me/competencies');
      setProfile(data);
    } catch {
      // no profile yet
    }
  }, []);

  const loadRecs = useCallback(async () => {
    try {
      const data = await matchService.getRecommendations(20);
      setRecs(data);
    } catch {
      // no recs yet
    }
  }, []);

  const loadQuestions = useCallback(async () => {
    try {
      const data = await questionService.getMyQuestions();
      setQuestions(data.filter(q => !q.resolved));
    } catch {
      // none
    }
  }, []);

  useEffect(() => {
    userService.getMe().then(me => {
      if (me.candidate_id) setCandidateId(me.candidate_id);
      setUserId(me.user_id);
      setUserFName(me.f_name);
      setUserLName(me.l_name);
      setUserEmail2(me.email);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!explainOf) { setExplanationText(null); return; }
    setExplanationLoading(true);
    matchService.explainMatch(explainOf.match_id)
      .then(r => setExplanationText(r.explanation))
      .catch(() => setExplanationText(null))
      .finally(() => setExplanationLoading(false));
  }, [explainOf]);

  useEffect(() => {
    if (!viewingJob) { setJobDetail(null); return; }
    setJobDetailLoading(true);
    jobService.getJob(viewingJob.job_id)
      .then(j => setJobDetail(j))
      .catch(() => setJobDetail(null))
      .finally(() => setJobDetailLoading(false));
  }, [viewingJob]);

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

  async function handleAccountDeleted() {
    await signOutUser();
    window.location.href = '/';
  }

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
                  <div className="stat-label">Best recommendation</div>
                  <div className="stat-value">{recs[0] ? `${Math.round(recs[0].recommendation_score * 100)}%` : '--'}</div>
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
              <Recommendations
                recs={recs.slice(0, 3)}
                onExplain={setExplainOf}
                onViewJob={setViewingJob}
              />
            </div>
          </>
        )}

        {active === 'recommendations' && (
          <>
            <PageHead
              eyebrow="Job matches"
              title="All recommendations"
              sub="Ranked by fit score weighted by competency coverage."
              actions={<button className="btn secondary" onClick={loadRecs}>Refresh</button>}
            />
            <Recommendations recs={recs} onExplain={setExplainOf} onViewJob={setViewingJob} />
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

        {active === 'settings' && userId !== null && (
          <>
            <PageHead
              eyebrow="Account"
              title="Settings"
              sub="Manage your profile, password, resume, and account."
            />
            <Settings
              userId={userId}
              initialFName={userFName}
              initialLName={userLName}
              initialEmail={userEmail2}
              onAccountDeleted={handleAccountDeleted}
            />
          </>
        )}
      </main>

      {/* Explain modal */}
      {explainOf && (
        <Modal
          title={`Why this matches — ${explainOf.title}`}
          onClose={() => setExplainOf(null)}
          footer={<button className="btn ghost" onClick={() => setExplainOf(null)}>Close</button>}
        >
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="score-chip">{Math.round(explainOf.recommendation_score * 100)}% recommendation</span>
            <Tier value={explainOf.qualification_tier} />
            <span style={{ color: 'var(--tm-fg-muted)', fontSize: 13 }}>{explainOf.company_name}</span>
          </div>
          <p style={{ lineHeight: 1.7, color: 'var(--tm-fg-1)', margin: '0 0 14px', whiteSpace: 'pre-line' }}>
            {explanationLoading ? 'Generating explanation…' : (explanationText ?? 'No explanation available.')}
          </p>
          {explainOf.gap_profile && (() => {
            const gaps = Object.entries(explainOf.gap_profile.scored).filter(([, v]) => v.gap > 0);
            return gaps.length > 0 ? (
              <div className="chart-cat" style={{ padding: 14 }}>
                <h4>Gaps detected</h4>
                {gaps.map(([k, v]) => (
                  <div className="bar-row" key={k}>
                    <div className="bar-label">{v.name}</div>
                    <div className="bar-track">
                      <div className="bar-fill gap" style={{ width: `${Math.round(v.candidate_level)}%` }} />
                    </div>
                    <div className="bar-value">-{v.gap.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            ) : null;
          })()}
        </Modal>
      )}

      {/* Job detail modal */}
      {viewingJob && (
        <Modal
          title={viewingJob.title}
          onClose={() => setViewingJob(null)}
          footer={<button className="btn ghost" onClick={() => setViewingJob(null)}>Close</button>}
        >
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="score-chip">{Math.round(viewingJob.recommendation_score * 100)}% match</span>
            <Tier value={viewingJob.qualification_tier} />
            <span style={{ color: 'var(--tm-fg-muted)', fontSize: 13 }}>{viewingJob.company_name}</span>
          </div>

          {jobDetailLoading ? (
            <p style={{ color: 'var(--tm-fg-muted)' }}>Loading…</p>
          ) : jobDetail ? (
            <p style={{ margin: '0 0 20px', lineHeight: 1.7, color: 'var(--tm-fg-1)', whiteSpace: 'pre-wrap' }}>
              {jobDetail.description}
            </p>
          ) : (
            <p style={{ color: 'var(--tm-fg-muted)', marginBottom: 20 }}>Could not load job description.</p>
          )}

          {/* Other matched jobs from same employer */}
          {(() => {
            const others = recs.filter(r => r.employer_id === viewingJob.employer_id && r.job_id !== viewingJob.job_id);
            if (others.length === 0) return null;
            return (
              <div style={{ borderTop: '1px solid var(--tm-line)', paddingTop: 16 }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--tm-fg-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  Other matched jobs from {viewingJob.company_name}
                </h4>
                <div className="match-list">
                  {others.map(r => (
                    <div className="match-row" key={r.match_id} style={{ cursor: 'pointer' }} onClick={() => setViewingJob(r)}>
                      <div className="match-info">
                        <h3 style={{ color: 'var(--tm-blue)' }}>{r.title}</h3>
                        <div className="match-meta">
                          <span className="score-chip">{Math.round(r.recommendation_score * 100)}%</span>
                          <Tier value={r.qualification_tier} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
}
