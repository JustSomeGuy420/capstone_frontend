import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { jobService, type Job, type CandidateRank } from '../../services/jobService';
import { matchService } from '../../services/matchService';
import { questionService, type Question } from '../../services/questionService';
import { profileService, type PublicCandidateProfile } from '../../services/profileService';
import { userService, type MeResponse } from '../../services/userService';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { PageHead } from '../../components/dashboard/PageHead';
import { Modal } from '../../components/dashboard/Modal';
import { Tier } from '../../components/dashboard/Tier';
import { IconArrowLeft } from '../../components/dashboard/Icons';
import '../../styles/dashboard.css';

// ---- Recruiter settings ----
function RecruiterSettings({
  me,
  onAccountDeleted,
}: {
  me: MeResponse;
  onAccountDeleted: () => void;
}) {
  const [fName, setFName] = useState(me.f_name);
  const [lName, setLName] = useState(me.l_name);
  const [email, setEmail] = useState(me.email);
  const [companyName, setCompanyName] = useState(me.company_name ?? '');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [oldPw, setOldPw] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg('');
    setProfileError('');
    try {
      await userService.updateUser(me.user_id, {
        f_name: fName, l_name: lName, email, company_name: companyName,
      });
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
      await userService.changePassword(oldPw, newPassword);
      setPasswordMsg('Password changed.');
      setOldPw('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    if (!confirm('Permanently delete your account and all job postings? This cannot be undone.')) return;
    try {
      await userService.deleteUser(me.user_id);
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
            <div className="card-sub">Update your name, email, and company name.</div>
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
          <div className="field">
            <label>Company name</label>
            <input value={companyName} onChange={e => setCompanyName(e.target.value)} />
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
            <input type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} required />
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
              disabled={savingPassword || !oldPw || !newPassword || newPassword !== confirmPassword}
            >
              {savingPassword ? 'Changing...' : 'Change password'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">
            <h2>Danger zone</h2>
            <div className="card-sub">Permanently deletes your account and all job postings.</div>
          </div>
        </div>
        <button className="btn danger sm" onClick={handleDeleteAccount}>Delete account</button>
      </div>
    </div>
  );
}

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
      const job = await jobService.createJob({ title, description });
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

// ---- Rankings table ----
function Rankings({
  rows,
  onExplain,
  onViewCandidate,
}: {
  rows: CandidateRank[];
  onExplain: (r: CandidateRank) => void;
  onViewCandidate: (r: CandidateRank) => void;
}) {
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
            <th>Fit score</th>
            <th>Tier</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.rank} className={r.knockout_failed ? 'knockout' : ''}>
              <td className="rank-cell">{r.rank}</td>
              <td>
                <button
                  className="btn ghost sm"
                  style={{ padding: '2px 6px', fontWeight: 700 }}
                  onClick={() => onViewCandidate(r)}
                >
                  {r.candidate_name}
                </button>
                {r.knockout_failed && <span className="knockout-label">Knockout</span>}
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

// ---- Job detail ----
function JobDetail({
  job,
  rankings,
  rankingsError,
  questions,
  onBack,
  onJobUpdated,
  onJobDeleted,
  onRerunMatching,
  rerunning,
  onExplain,
  onViewCandidate,
  onAnswerQuestion,
}: {
  job: Job;
  rankings: CandidateRank[];
  rankingsError: string;
  questions: Question[];
  onBack: () => void;
  onJobUpdated: (job: Job) => void;
  onJobDeleted: (jobId: number) => void;
  onRerunMatching: (jobId: number) => void;
  rerunning: boolean;
  onExplain: (r: CandidateRank) => void;
  onViewCandidate: (r: CandidateRank) => void;
  onAnswerQuestion: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(job.title);
  const [editDescription, setEditDescription] = useState(job.description);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      const updated = await jobService.updateJob(job.job_id, { title: editTitle, description: editDescription });
      onJobUpdated(updated);
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus() {
    setTogglingStatus(true);
    try {
      const updated = await jobService.setJobStatus(job.job_id, !job.is_active);
      onJobUpdated(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle status.');
    } finally {
      setTogglingStatus(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await jobService.deleteJob(job.job_id);
      onJobDeleted(job.job_id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete job.');
      setDeleting(false);
    }
  }

  const jobQuestions = questions.filter(q => q.job_id === job.job_id && !q.resolved);

  return (
    <div className="stack">
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button className="btn ghost sm" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconArrowLeft /> My Jobs
        </button>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--tm-fg-1)', flex: 1 }}>
          {job.title}
        </h1>
        <span className={`tier ${job.is_active ? 'strong' : 'partial'}`}>
          {job.is_active ? 'Active' : 'Unlisted'}
        </span>
        <button className="btn secondary sm" onClick={handleToggleStatus} disabled={togglingStatus}>
          {togglingStatus ? '...' : job.is_active ? 'Unlist' : 'Re-activate'}
        </button>
        <button className="btn secondary sm" onClick={() => setEditing(e => !e)}>
          {editing ? 'Cancel edit' : 'Edit'}
        </button>
        <button className="btn danger sm" onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="card">
          <form className="stack-sm" onSubmit={handleSave}>
            <div className="field">
              <label>Title</label>
              <input value={editTitle} onChange={e => setEditTitle(e.target.value)} required />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} required />
            </div>
            {saveError && <p className="form-error">{saveError}</p>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn ghost sm" type="button" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn primary sm" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Description */}
      {!editing && (
        <div className="card tight">
          <div className="card-head" style={{ marginBottom: 8 }}>
            <div className="card-title"><h2 style={{ fontSize: '1.1rem' }}>Description</h2></div>
          </div>
          <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--tm-fg-1)', whiteSpace: 'pre-wrap' }}>{job.description}</p>
        </div>
      )}

      {/* Rankings */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">
            <h2>Ranked candidates</h2>
            <div className="card-sub">Fit score = match × coverage. Knockout-failed candidates are kept for context but visually muted.</div>
          </div>
          <button
            className="btn secondary sm"
            disabled={rerunning}
            onClick={() => onRerunMatching(job.job_id)}
          >
            {rerunning ? 'Running...' : 'Re-run matching'}
          </button>
        </div>
        {rankingsError && <p className="form-error" style={{ marginBottom: 12 }}>{rankingsError}</p>}
        <Rankings rows={rankings} onExplain={onExplain} onViewCandidate={onViewCandidate} />
      </div>

      {/* Clarifying questions for this job */}
      {jobQuestions.length > 0 && (
        <div className="card">
          <div className="card-head">
            <div className="card-title">
              <h2>Clarifying questions</h2>
              <div className="card-sub">Answer to improve competency weighting for this job.</div>
            </div>
          </div>
          <div className="stack-sm">
            {jobQuestions.map(q => (
              <RecruiterQuestionCard key={q.question_id} q={q} onAnswer={onAnswerQuestion} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Recruiter question card ----
function RecruiterQuestionCard({ q, onAnswer }: { q: Question; onAnswer: (id: number) => void }) {
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
      <span className="question-reason">ambiguous requirement · {q.competency_name}</span>
      <div className="question-text">{q.question_text}</div>
      <textarea
        placeholder="Set the bar so we can rank correctly."
        value={answer}
        onChange={e => setAnswer(e.target.value)}
      />
      <div className="question-foot">
        <span className="question-ctx">Job {q.job_id} · Element {q.element_id}</span>
        <button className="btn primary sm" disabled={!answer || submitting} onClick={handleSubmit}>
          {submitting ? 'Submitting...' : 'Submit answer'}
        </button>
      </div>
    </div>
  );
}

// ---- Main dashboard ----
export default function RecruiterDashboard() {
  const { userName, userEmail, accountType, signOutUser } = useAuth();
  const [active, setActive] = useState('overview');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [rankings, setRankings] = useState<Record<number, CandidateRank[]>>({});
  const [rankingsError, setRankingsError] = useState('');
  const [rerunning, setRerunning] = useState(false);
  const [detailJobId, setDetailJobId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [me, setMe] = useState<MeResponse | null>(null);

  // Explain modal
  const [explainOf, setExplainOf] = useState<CandidateRank | null>(null);
  const [explanationText, setExplanationText] = useState<string | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);

  // Candidate profile modal
  const [viewingCandidate, setViewingCandidate] = useState<CandidateRank | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<PublicCandidateProfile | null>(null);
  const [candidateProfileLoading, setCandidateProfileLoading] = useState(false);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [resumeExpanded, setResumeExpanded] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);

  useEffect(() => {
    if (!explainOf) { setExplanationText(null); return; }
    setExplanationLoading(true);
    matchService.explainMatch(explainOf.match_id)
      .then(r => setExplanationText(r.explanation))
      .catch(() => setExplanationText(null))
      .finally(() => setExplanationLoading(false));
  }, [explainOf]);

  useEffect(() => {
    if (!viewingCandidate) {
      setCandidateProfile(null);
      setResumeText(null);
      setResumeExpanded(false);
      return;
    }
    setCandidateProfileLoading(true);
    profileService.getCandidateProfile(viewingCandidate.candidate_id)
      .then(p => setCandidateProfile(p))
      .catch(() => setCandidateProfile(null))
      .finally(() => setCandidateProfileLoading(false));
  }, [viewingCandidate]);

  function handleExpandResume() {
    if (!viewingCandidate || resumeText !== null) { setResumeExpanded(e => !e); return; }
    setResumeLoading(true);
    profileService.getCandidateResume(viewingCandidate.candidate_id)
      .then(r => { setResumeText(r.resume_text); setResumeExpanded(true); })
      .catch(() => { setResumeText(''); setResumeExpanded(true); })
      .finally(() => setResumeLoading(false));
  }

  const loadQuestions = useCallback(async () => {
    try {
      const data = await questionService.getMyQuestions();
      setQuestions(data);
    } catch {
      // none
    }
  }, []);

  const loadJobs = useCallback(async () => {
    try {
      const data = await jobService.listJobs();
      setJobs(data);
    } catch {
      // none
    }
  }, []);

  const loadRankings = useCallback(async (jobId: number) => {
    setRankingsError('');
    try {
      const data = await jobService.getRankings(jobId);
      setRankings(prev => ({ ...prev, [jobId]: data }));
    } catch (err) {
      setRankingsError(err instanceof Error ? err.message : 'Failed to load rankings.');
    }
  }, []);

  const rerunMatching = useCallback(async (jobId: number) => {
    setRerunning(true);
    try {
      await matchService.triggerJobMatching(jobId);
      setTimeout(() => loadRankings(jobId), 3000);
    } catch (err) {
      setRankingsError(err instanceof Error ? err.message : 'Failed to trigger matching.');
    } finally {
      setRerunning(false);
    }
  }, [loadRankings]);

  useEffect(() => {
    userService.getMe().then(data => {
      setMe(data);
      if (data.company_name) setCompanyName(data.company_name);
    }).catch(() => {});
    loadJobs();
    loadQuestions();
  }, [loadJobs, loadQuestions]);

  // Pre-load rankings for all jobs in overview
  useEffect(() => {
    jobs.forEach(j => {
      if (!rankings[j.job_id]) loadRankings(j.job_id);
    });
  }, [jobs, rankings, loadRankings]);

  const name = userName ?? 'Account';
  const email = userEmail ?? '';
  const firstName = name.split(' ')[0];
  const detailJob = jobs.find(j => j.job_id === detailJobId) ?? null;
  const detailRankings = detailJobId ? (rankings[detailJobId] ?? []) : [];
  const totalStrong = Object.values(rankings).flat().filter(r => r.qualification_tier === 'strong_fit').length;

  function handleNewJob(job: Job) {
    setJobs(prev => [job, ...prev]);
    setDetailJobId(job.job_id);
    setActive('jobs');
  }

  function handleJobUpdated(updated: Job) {
    setJobs(prev => prev.map(j => j.job_id === updated.job_id ? updated : j));
  }

  function handleJobDeleted(jobId: number) {
    setJobs(prev => prev.filter(j => j.job_id !== jobId));
    setDetailJobId(null);
  }

  function handleAnswerQuestion(id: number) {
    setQuestions(qs => qs.map(q => q.question_id === id ? { ...q, resolved: true } : q));
  }

  function handleOpenJobDetail(jobId: number) {
    setDetailJobId(jobId);
    setActive('jobs');
    if (!rankings[jobId]) loadRankings(jobId);
  }

  const topRankByJob = jobs.map(j => {
    const ranks = rankings[j.job_id];
    return { job: j, top: ranks?.[0] ?? null };
  });

  return (
    <div className="app-shell">
      <Sidebar
        active={active}
        onNavigate={id => { setActive(id); if (id !== 'jobs') setDetailJobId(null); }}
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
                  <div className="stat-value">{jobs.filter(j => j.is_active).length}</div>
                  <div className="stat-sub">{jobs.filter(j => !j.is_active).length} unlisted</div>
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

              {/* Job cards with top candidate */}
              {jobs.length === 0 ? (
                <div className="card">
                  <div className="uploaded-row">
                    <div className="file-meta">
                      <div className="file-name">No jobs posted yet</div>
                      <div className="file-sub">Post your first role to start seeing ranked candidates.</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid-2">
                  {topRankByJob.map(({ job, top }) => (
                    <button
                      key={job.job_id}
                      className="job-card"
                      onClick={() => handleOpenJobDetail(job.job_id)}
                      style={{ textAlign: 'left', width: '100%', border: 'none', cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3>{job.title}</h3>
                        <span className={`tier ${job.is_active ? 'strong' : 'partial'}`} style={{ fontSize: 11, marginLeft: 8 }}>
                          {job.is_active ? 'Active' : 'Unlisted'}
                        </span>
                      </div>
                      <div className="job-meta">
                        <span>Posted {job.created_at.slice(0, 10)}</span>
                        {top ? (
                          <>
                            <span className="dot" />
                            <span>Top: {top.candidate_name} ({top.job_score.toFixed(2)})</span>
                          </>
                        ) : (
                          <>
                            <span className="dot" />
                            <span>No candidates ranked yet</span>
                          </>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {active === 'jobs' && (
          <>
            {detailJob ? (
              <JobDetail
                job={detailJob}
                rankings={detailRankings}
                rankingsError={rankingsError}
                questions={questions}
                onBack={() => setDetailJobId(null)}
                onJobUpdated={handleJobUpdated}
                onJobDeleted={handleJobDeleted}
                onRerunMatching={rerunMatching}
                rerunning={rerunning}
                onExplain={setExplainOf}
                onViewCandidate={setViewingCandidate}
                onAnswerQuestion={handleAnswerQuestion}
              />
            ) : (
              <>
                <PageHead
                  eyebrow="Job postings"
                  title="My Jobs"
                  sub="Click a job to see its details, rankings, and controls."
                  actions={<button className="btn primary" onClick={() => setActive('post')}>Post a job</button>}
                />
                {jobs.length === 0 ? (
                  <div className="card">
                    <div className="uploaded-row">
                      <div className="file-meta">
                        <div className="file-name">No jobs posted yet</div>
                        <div className="file-sub">Post your first role to start seeing ranked candidates.</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="stack-sm">
                    {jobs.map(j => {
                      const top = rankings[j.job_id]?.[0];
                      return (
                        <button
                          key={j.job_id}
                          className="job-card"
                          onClick={() => handleOpenJobDetail(j.job_id)}
                          style={{ textAlign: 'left', width: '100%', border: 'none', cursor: 'pointer' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h3>{j.title}</h3>
                            <span className={`tier ${j.is_active ? 'strong' : 'partial'}`} style={{ fontSize: 11 }}>
                              {j.is_active ? 'Active' : 'Unlisted'}
                            </span>
                          </div>
                          <div className="job-meta">
                            <span>Posted {j.created_at.slice(0, 10)}</span>
                            {top ? (
                              <>
                                <span className="dot" />
                                <span>{rankings[j.job_id]?.length ?? 0} ranked · Top: {top.candidate_name} ({top.job_score.toFixed(2)})</span>
                              </>
                            ) : (
                              <>
                                <span className="dot" />
                                <span>No candidates ranked yet</span>
                              </>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
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
                    <RecruiterQuestionCard
                      key={q.question_id}
                      q={q}
                      onAnswer={handleAnswerQuestion}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {active === 'settings' && me && (
          <>
            <PageHead
              eyebrow="Account"
              title="Settings"
              sub="Manage your profile, company name, password, and account."
            />
            <RecruiterSettings
              me={me}
              onAccountDeleted={async () => {
                await signOutUser();
                window.location.href = '/';
              }}
            />
          </>
        )}
      </main>

      {/* Explain modal */}
      {explainOf && (
        <Modal
          title={`Why ${explainOf.candidate_name} ranked #${explainOf.rank}`}
          onClose={() => setExplainOf(null)}
          footer={<button className="btn ghost" onClick={() => setExplainOf(null)}>Close</button>}
        >
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <span className="score-chip">Fit score {explainOf.job_score.toFixed(2)}</span>
            <Tier value={explainOf.qualification_tier} />
            {explainOf.knockout_failed && <span className="tier low">Knockout</span>}
          </div>
          <p style={{ lineHeight: 1.7, margin: '0 0 8px', color: 'var(--tm-fg-1)', whiteSpace: 'pre-line' }}>
            {explanationLoading ? 'Generating explanation…' : (explanationText ?? 'No explanation available.')}
          </p>
        </Modal>
      )}

      {/* Candidate profile modal */}
      {viewingCandidate && (
        <Modal
          title={viewingCandidate.candidate_name}
          onClose={() => setViewingCandidate(null)}
          footer={<button className="btn ghost" onClick={() => setViewingCandidate(null)}>Close</button>}
        >
          {candidateProfileLoading ? (
            <p style={{ color: 'var(--tm-fg-muted)' }}>Loading profile…</p>
          ) : candidateProfile ? (
            <>
              {candidateProfile.tech_keywords.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--tm-fg-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Tech skills</h4>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {candidateProfile.tech_keywords.map(k => (
                      <span key={k} className="score-chip" style={{ fontSize: 12 }}>{k}</span>
                    ))}
                  </div>
                </div>
              )}

              {candidateProfile.competencies.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--tm-fg-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Top competencies</h4>
                  {candidateProfile.competencies.slice(0, 8).map(c => (
                    <div className="bar-row" key={c.competency_name}>
                      <div className="bar-label" title={c.competency_name}>{c.competency_name}</div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${Math.round(c.level_score ?? 0)}%` }} />
                      </div>
                      <div className="bar-value">{Math.round(c.level_score ?? 0)}</div>
                    </div>
                  ))}
                </div>
              )}

              {candidateProfile.matches.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--tm-fg-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Their matches for your jobs</h4>
                  <div className="match-list">
                    {candidateProfile.matches.map(m => (
                      <div className="match-row" key={m.match_id}>
                        <div className="match-info">
                          <h3>{m.job_title}</h3>
                          <div className="match-meta">
                            <span className="score-chip">Fit {m.job_score.toFixed(2)}</span>
                            <Tier value={m.qualification_tier} />
                            {m.knockout_failed && <span className="tier low">Knockout</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {candidateProfile.competencies.length === 0 && candidateProfile.matches.length === 0 && (
                <p style={{ color: 'var(--tm-fg-muted)' }}>No scored competencies on file yet.</p>
              )}

              {/* Resume text (lazy) */}
              <div style={{ borderTop: '1px solid var(--tm-line)', paddingTop: 14, marginTop: 4 }}>
                <button
                  className="btn ghost sm"
                  onClick={handleExpandResume}
                  disabled={resumeLoading}
                  style={{ marginBottom: resumeExpanded ? 10 : 0 }}
                >
                  {resumeLoading ? 'Loading…' : resumeExpanded ? 'Hide resume text' : 'Show resume text'}
                </button>
                {resumeExpanded && (
                  resumeText
                    ? <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.6, color: 'var(--tm-fg-1)', maxHeight: 400, overflowY: 'auto', background: 'var(--tm-bg)', borderRadius: 10, padding: 14 }}>{resumeText}</pre>
                    : <p style={{ color: 'var(--tm-fg-muted)', margin: 0 }}>No resume text available.</p>
                )}
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--tm-fg-muted)' }}>Could not load candidate profile.</p>
          )}
        </Modal>
      )}
    </div>
  );
}
