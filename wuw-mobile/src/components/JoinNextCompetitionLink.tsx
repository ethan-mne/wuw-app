import { Link } from 'react-router-dom';

type JoinNextCompetitionLinkProps = {
  joinTo: string | null;
  className: string;
  children: unknown;
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
        {children as never}
      </span>
    );
  }

  return (
    <Link className={className} to={joinTo}>
      {children as never}
    </Link>
  );
}
