import { Link } from 'react-router-dom';
import {
  Card as SharedCard,
  PageHeader as SharedPageHeader,
  StatPill as SharedStatPill,
} from '@wuw/mobile-ui';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return <SharedPageHeader eyebrow={eyebrow} title={title} description={description} />;
}

interface CardProps {
  children: unknown;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return <SharedCard className={className}>{children}</SharedCard>;
}

interface ActionLinkProps {
  to: string;
  children: unknown;
  variant?: 'primary' | 'secondary';
}

export function ActionLink({ to, children, variant = 'primary' }: ActionLinkProps) {
  return (
    <Link className={`action-link ${variant}`} to={to}>
      {children as never}
    </Link>
  );
}

interface StatPillProps {
  label: string;
  value: string | number;
}

export function StatPill({ label, value }: StatPillProps) {
  return <SharedStatPill label={label} value={value} />;
}
