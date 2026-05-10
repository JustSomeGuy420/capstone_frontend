import { useAuth } from '../context/AuthContext';
import ApplicantDashboard from './applicant/ApplicantDashboard';
import RecruiterDashboard from './recruiter/RecruiterDashboard';

export default function DashboardPlaceholderPage() {
  const { accountType } = useAuth();
  if (accountType === 'recruiter') return <RecruiterDashboard />;
  return <ApplicantDashboard />;
}
