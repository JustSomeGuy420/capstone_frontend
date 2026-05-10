import type { AccountType } from '../../types/auth';
import { IconHome, IconBriefcase, IconChart, IconQuestion, IconSparkles } from './Icons';

type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
};

type Props = {
  active: string;
  onNavigate: (id: string) => void;
  accountType: AccountType;
  name: string;
  email: string;
  counts?: { recs?: number; jobs?: number; questions?: number };
};

export function Sidebar({ active, onNavigate, accountType, name, email, counts }: Props) {
  const initials = name.split(' ').map(s => s[0]).slice(0, 2).join('');

  const items: NavItem[] = accountType === 'applicant'
    ? [
        { id: 'overview',         label: 'Overview',              icon: <IconHome /> },
        { id: 'recommendations',  label: 'Recommendations',       icon: <IconBriefcase />, count: counts?.recs },
        { id: 'competencies',     label: 'My competencies',       icon: <IconChart /> },
        { id: 'questions',        label: 'Clarifying questions',  icon: <IconQuestion />, count: counts?.questions },
      ]
    : [
        { id: 'overview',  label: 'Overview',             icon: <IconHome /> },
        { id: 'jobs',      label: 'My jobs',              icon: <IconBriefcase />, count: counts?.jobs },
        { id: 'post',      label: 'Post a job',           icon: <IconSparkles /> },
        { id: 'questions', label: 'Clarifying questions', icon: <IconQuestion />, count: counts?.questions },
      ];

  return (
    <aside className="sidebar">
      <a className="sidebar-brand" href="/">
        <span className="brand-glyph"><span className="brand-glyph-inner" /></span>
        <span className="brand-name">Transparent Match</span>
      </a>

      <nav className="sidebar-nav">
        {items.map(item => (
          <button
            key={item.id}
            className={`nav-item ${active === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="ico">{item.icon}</span>
            {item.label}
            {item.count != null && <span className="count">{item.count}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="sidebar-foot-row">
          <div className="avatar-mono dark">{initials}</div>
          <div>
            <div className="foot-name">{name}</div>
            <div className="foot-email">{email}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
