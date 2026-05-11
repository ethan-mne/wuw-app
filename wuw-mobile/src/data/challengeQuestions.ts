/**
 * Fixed skill-challenge prompts. Assets: `public/challenge/q1.png` … `q5.png`.
 */
const root = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

/** Single heading for every challenge round (photo + choices carry the detail). */
const CHALLENGE_PROMPT = 'What is this model?';

export type ChallengeQuestion = {
  id: string;
  imageSrc: string;
  alt: string;
  prompt: string;
  /** Four multiple-choice answers (order is rotated in the UI). */
  options: readonly [string, string, string, string];
};

export const CHALLENGE_QUESTIONS: readonly ChallengeQuestion[] = [
  {
    id: '1',
    imageSrc: `${root}challenge/q1.png`,
    alt: 'Rolex Cosmograph Daytona with white dial and black ceramic bezel',
    prompt: CHALLENGE_PROMPT,
    options: [
      'Rolex Cosmograph Daytona',
      'Tudor Black Bay Chrono',
      'Omega Speedmaster Moonwatch',
      'TAG Heuer Carrera',
    ],
  },
  {
    id: '2',
    imageSrc: `${root}challenge/q2.png`,
    alt: 'Richard Mille tonneau watch with transparent sapphire case',
    prompt: CHALLENGE_PROMPT,
    options: [
      'Richard Mille',
      'Hublot',
      'Jacob & Co.',
      'Audemars Piguet',
    ],
  },
  {
    id: '3',
    imageSrc: `${root}challenge/q3.png`,
    alt: 'Patek Philippe Nautilus stainless steel with blue embossed dial',
    prompt: CHALLENGE_PROMPT,
    options: [
      'Patek Philippe Nautilus',
      'Patek Philippe Aquanaut',
      'Audemars Piguet Royal Oak',
      'Vacheron Constantin Overseas',
    ],
  },
  {
    id: '4',
    imageSrc: `${root}challenge/q4.png`,
    alt: 'Patek Philippe Aquanaut with black tropical dial and composite strap',
    prompt: CHALLENGE_PROMPT,
    options: [
      'Patek Philippe Aquanaut',
      'Patek Philippe Nautilus',
      'Audemars Piguet Royal Oak',
      'IWC Ingenieur',
    ],
  },
  {
    id: '5',
    imageSrc: `${root}challenge/q5.png`,
    alt: 'Rolex GMT-Master II on Jubilee bracelet with black dial',
    prompt: CHALLENGE_PROMPT,
    options: [
      'Rolex GMT-Master II',
      'Rolex Submariner Date',
      'Rolex Explorer II',
      'Rolex Sea-Dweller',
    ],
  },
];

export const CHALLENGE_QUESTION_COUNT = CHALLENGE_QUESTIONS.length;
