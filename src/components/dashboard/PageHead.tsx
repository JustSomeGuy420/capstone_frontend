type Props = {
  eyebrow?: string;
  title: string;
  sub?: string;
  actions?: React.ReactNode;
};

export function PageHead({ eyebrow, title, sub, actions }: Props) {
  return (
    <div className="page-head">
      <div className="page-head-title">
        {eyebrow && <span className="page-head-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {sub && <p className="page-head-sub">{sub}</p>}
      </div>
      {actions && <div className="row-actions">{actions}</div>}
    </div>
  );
}
