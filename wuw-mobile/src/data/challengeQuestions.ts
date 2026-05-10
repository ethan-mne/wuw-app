/**
 * Fixed skill-challenge prompts (not tied to competition gallery).
 * Swap in real photos under `public/challenge/` (q1.jpg … q5.jpg) and update `imageSrc` below.
 */
const root = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export type ChallengeQuestion = {
  id: string;
  imageSrc: string;
  alt: string;
  /** Shown as the challenge heading for this round. */
  prompt: string;
};

export const CHALLENGE_QUESTIONS: readonly ChallengeQuestion[] = [
  {
    id: '1',
    imageSrc: `${root}challenge/q1.svg`,
    alt: 'Skill challenge question 1',
    prompt: 'What watch is this?',
  },
  {
    id: '2',
    imageSrc: `${root}challenge/q2.svg`,
    alt: 'Skill challenge question 2',
    prompt: 'Which brand made this model?',
  },
  {
    id: '3',
    imageSrc: `${root}challenge/q3.svg`,
    alt: 'Skill challenge question 3',
    prompt: 'Pick the watch that matches this style.',
  },
  {
    id: '4',
    imageSrc: `${root}challenge/q4.svg`,
    alt: 'Skill challenge question 4',
    prompt: 'Name this reference from the dial details.',
  },
  {
    id: '5',
    imageSrc: `${root}challenge/q5.svg`,
    alt: 'Skill challenge question 5',
    prompt: 'Which complication is most prominent here?',
  },
];

export const CHALLENGE_QUESTION_COUNT = CHALLENGE_QUESTIONS.length;
