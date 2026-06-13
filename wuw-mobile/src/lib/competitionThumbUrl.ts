import { resolveMediaUrl } from './resolveMediaUrl';
import type { Competition } from '../types';

type CompetitionThumbSource = Pick<Competition, 'watch' | 'competitionImageUrl'>;

export function competitionThumbUrl(source: CompetitionThumbSource): string {
  const fromWatch = resolveMediaUrl(source.watch?.images?.[0]?.url);
  if (fromWatch) {
    return fromWatch;
  }
  return resolveMediaUrl(source.competitionImageUrl ?? '');
}
