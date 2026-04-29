export interface PastCompetition {
  image: string;
  watch_name: string;
  win_date: string;
  value: number;
}

export interface UpcomingCompetition {
  image: string;
  watch_name: string;
  entry_price: number;
  value: number;
  link: string;
}

export interface Article {
  id: string;
  title: string;
  published_at: string;
  image: string;
  link: string;
}
