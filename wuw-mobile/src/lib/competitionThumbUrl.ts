import { resolveMediaUrl } from './resolveMediaUrl';

type CompetitionThumbSource = {
  watch?: {
    images?: Array<{ url?: string | null }>;
  };
  competitionImageUrl?: string | null;
};

export function competitionThumbUrl(source: CompetitionThumbSource): string {
  const fromWatch = resolveMediaUrl(source.watch?.images?.[0]?.url);
  if (fromWatch) {
    return fromWatch;
  }
  return resolveMediaUrl(source.competitionImageUrl ?? '');
}
