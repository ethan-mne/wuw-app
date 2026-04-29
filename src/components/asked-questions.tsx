import { frequentlyAskedQuestions } from '@/data/asked-questions';
import {
  Accordion,
  AccordionItem,
  AccordionContent,
  AccordionTrigger,
} from './ui/accordion';
import { useTranslations } from 'next-intl';

export function AskedQuestions({
  maxToShow = undefined,
}: {
  maxToShow?: number;
}) {
  const Tfaq = useTranslations('faq');
  const sliceNumber = maxToShow ? maxToShow : frequentlyAskedQuestions.length;
  const new_data = frequentlyAskedQuestions.slice(0, sliceNumber).map((d) => {
    return {
      id: d.id,
      //@ts-expect-error - I don't have type
      question: Tfaq(d.questionSlug),
      //@ts-expect-error - I don't have type
      answer: Tfaq(d.answerSlug),
    };
  });
  return (
    <div className='w-full'>
      {new_data.map((q) => (
        <Question {...q} key={q.id} />
      ))}
    </div>
  );
}

function Question({
  id,
  question,
  answer,
}: {
  id: string;
  question: string;
  answer: string;
}) {
  return (
    <Accordion type='single' collapsible>
      <AccordionItem value={id}>
        <AccordionTrigger className='text-start font-bold text-[18x] text-black hover:no-underline md:text-[24px]'>
          {question}
        </AccordionTrigger>
        <AccordionContent className='text-[#898989]   font-medium'>
          {answer}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
