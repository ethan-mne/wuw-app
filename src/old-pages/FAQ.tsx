import Head from 'next/head';
import Link from 'next/link';
import styles from '@/styles/Terms.module.css';

const FAQ = () => {
  return (
    <div className={styles.TermsCon}>
      <Head>
        <title>Win u Watch - FAQ</title>
        <meta name='description' content='Win u Watch - FAQ' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <Link href='/'>Home</Link>
      <div className={styles.TermsTxt}>
        <h1>FAQ</h1>
        <p className={styles.MainP}>
          <h2>How do I participate?</h2> <br />
          Select the number of tickets you&apos;d like, take part in our
          skill-based game, purchase your tickets, and you&apos;ll have a chance
          to win a luxury watch. It&apos;s as easy as that.
          <br /> Learn more about the process here.
          <br />
          <br /> <h2>What are the prizes?</h2> <br />
          Each drawing offers players an opportunity to win a luxury watch
          valued at over £10,000. Visit the homepage for information on the make
          and model of the watch you could win in the upcoming draw.
          <br />
          <br /> <h2>How many tickets can I purchase?</h2>
          <br />
          You can buy up to 25 tickets per person.
          <br />
          <br /> <h2>When is the next drawing?</h2>
          <br />
          Refer to the homepage for information on the date of the next drawing.
          <br />
          <br /> <h2>How is the winner selected?</h2>
          <br />
          We utilize a third-party Random Number Generator called Randomdraws.
          <br />
          <br /> <h2>How many winners will there be?</h2>
          <br />
          Each drawing will have one watch winner, with additional runner-up
          prizes available where indicated.
          <br />
          <br /> <h2>How will I be informed if I&apos;ve won?</h2>
          <br />
          Winners will be notified via email.
          <br />
          <br /> <h2>What if not enough tickets are sold?</h2>
          <br />
          We have a large subscriber base, so we anticipate strong demand for
          each drawing. However, if we don&apos;t sell enough tickets before the
          deadline, we&apos;ll extend the entry period up to three times.
          <br />
          <br /> <h2>Is this a lottery?</h2>
          <br />
          No, it&apos;s a competition that falls within the realm of prize
          competitions or free draws. The outcome is determined by a skill-based
          game.
          <br />
          <br /> <h2>What is the skill-based game?</h2>
          <br />
          The skill-based game tests user&apos;s knowledge and skills in a
          specific area: watches. Only those who correctly answer the
          skill-based game questions will advance to the final draw.
          <br />
          <br /> <h2>Who can participate?</h2>
          <br />
          Participants must be at least 18 years old.
          <br />
          <br /> <h2>Who&apos;s behind Win a Watch?</h2>
          <br />
          We&apos;re a UK-based start-up dedicated to making luxury watch brands
          more accessible. Our small team is based in London – say hello here.
          <br />
          <br /> <h2>How do ticket sales support charity?</h2>
          <br />
          For every ticket sold, we plant one tree with Ecologi, a UK-based
          social enterprise focused on combating climate change. They make it
          easy for businesses and individuals to plant trees worldwide. Their
          goal is to plant one billion trees, and we at Lux are striving to be
          their top contributor.
          <br /> You can track the impact of our community&apos;s efforts here.
          <br />
          <br /> <h2>How many tickets are allocated for the final draw?</h2>
          <br /> The total number of tickets varies depending on the total prize
          fund. We announce the total ticket numbers before launching each
          competition.
          <br />
          <br />
        </p>
      </div>
    </div>
  );
};

export default FAQ;
