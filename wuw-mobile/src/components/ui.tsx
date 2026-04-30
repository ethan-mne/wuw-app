import type { PropsWithChildren, ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="page-header">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </header>
  );
}

export function Card({ children }: PropsWithChildren) {
  return <section className="card">{children}</section>;
}

interface ActionLinkProps {
  to: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
}

export function ActionLink({ to, children, variant = 'primary' }: ActionLinkProps) {
  return (
    <Link className={`action-link ${variant}`} to={to}>
      {children}
    </Link>
  );
}

interface StatPillProps {
  label: string;
  value: string | number;
}

export function StatPill({ label, value }: StatPillProps) {
  return (
    <div className="stat-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
