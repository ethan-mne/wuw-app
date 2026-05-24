import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type JoinNextCompetitionLinkProps = {
  joinTo: string | null;
  className: string;
  children: ReactNode;
  loading?: boolean;
};

export function JoinNextCompetitionLink({
  joinTo,
  className,
  children,
  loading = false,
}: JoinNextCompetitionLinkProps) {
  if (loading || !joinTo) {
    return (
      <span
        className={`${className} join-next-competition-link--disabled`}
        aria-disabled="true"
      >
        {children}
      </span>
    );
  }

  return (
    <Link className={className} to={joinTo}>
      {children}
    </Link>
  );
}
