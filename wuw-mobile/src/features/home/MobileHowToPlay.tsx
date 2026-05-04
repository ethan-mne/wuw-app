import { Link } from 'react-router-dom';
import { defaultLocale } from '../../routes/locales';
import { HowToPlayBagIcon, HowToPlayCupIcon, HowToPlayHandIcon, HowToPlayPlayIcon } from './howToPlayIcons';

const COPY = {
  eyebrow: 'How to',
  titleLine: 'Enter the competition',
  intro:
    'Get a chance to win the next contest and get your dream watch.\n No matter how many tickets are sold, the competition will take place and there will be a winner. The date of the competition cannot be postponed; however, it can be moved up in case of a sold-out event.',
  joinCta: 'Join the next competition',
  steps: [
    {
      key: 'choose',
      title: 'CHOOSE',
      body: 'Choose how many tickets you want (Up to 50 per player) and get ready to own a prestigious timepiece.',
      variant: 'dark' as const,
      Icon: HowToPlayCupIcon,
    },
    {
      key: 'play',
      title: 'Play',
      body: 'Test your watch expertise with our online game, meticulously crafted to separate the true connoisseurs from the casual admirers.',
      variant: 'light' as const,
      Icon: HowToPlayPlayIcon,
    },
    {
      key: 'buy',
      title: 'Buy',
      body: 'Pay Safely to Enter. Our partner Randomdraws uses a third-party Random Number Generator for an impartial and secure winner selection process.',
      variant: 'muted' as const,
      Icon: HowToPlayBagIcon,
    },
    {
      key: 'win',
      title: 'Win your watch',
      body: "That's all there is to it! With a minimal entry of just £25, you could be the lucky winner of a brand-new £20,000 timepiece.",
      variant: 'green' as const,
      Icon: HowToPlayHandIcon,
    },
  ],
};

export function MobileHowToPlay() {
  return (
    <section className="home-how-to-play" aria-labelledby="home-how-to-play-title">
      <div className="home-how-to-play-header">
        <p className="home-how-to-play-eyebrow">{COPY.eyebrow}</p>
        <h2 id="home-how-to-play-title" className="home-how-to-play-title">
          {COPY.titleLine}
        </h2>
        <p className="home-how-to-play-intro">{COPY.intro}</p>
      </div>

      <ol className="home-how-to-play-steps">
        {COPY.steps.map((step) => (
          <li key={step.key} className="home-how-to-play-step">
            <div
              className={`home-how-to-play-icon home-how-to-play-icon--${step.variant}`}
              aria-hidden
            >
              <step.Icon className="home-how-to-play-icon-svg" />
            </div>
            <div className="home-how-to-play-step-body">
              <p className="home-how-to-play-step-title">{step.title}</p>
              <p className="home-how-to-play-step-text">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <Link className="home-how-to-play-cta" to={`/${defaultLocale}/competitions`}>
        {COPY.joinCta}
      </Link>
    </section>
  );
}
