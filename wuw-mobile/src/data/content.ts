import type { Article } from '../types';

export const articles: Article[] = [
  {
    slug: 'article-1',
    title: 'How Winuwatch competitions work',
    excerpt: 'A short guide to tickets, draws and winner confirmation.',
    category: 'How to play',
    publishedAt: '2024-04-10',
    readTime: '3 min',
  },
  {
    slug: 'article-2',
    title: 'Choosing your first luxury watch',
    excerpt: 'A mobile-friendly overview of key watch details to compare.',
    category: 'Guide',
    publishedAt: '2024-04-04',
    readTime: '4 min',
  },
  {
    slug: 'article-3',
    title: 'What happens after a draw',
    excerpt: 'Confirmation, delivery and next steps for competition winners.',
    category: 'Winners',
    publishedAt: '2024-03-21',
    readTime: '2 min',
  },
];

export const supportPages = [
  {
    path: 'about-us',
    title: 'About us',
    summary: 'Mobile adaptation of the web about-us page.',
  },
  {
    path: 'howtoplay',
    title: 'How to play',
    summary: 'Explains the competition flow, tickets and draws.',
  },
  {
    path: 'faq',
    title: 'FAQ',
    summary: 'Frequently asked questions from the web product.',
  },
  {
    path: 'contact-us',
    title: 'Contact us',
    summary: 'Support entry point for mobile users.',
  },
  {
    path: 'engagement',
    title: 'Engagement',
    summary: 'Marketing and charity content adapted later for mobile.',
  },
] as const;

export const legalPages = [
  {
    path: 'privacy-policy',
    title: 'Privacy policy',
  },
  {
    path: 'terms-and-conditions',
    title: 'Terms and conditions',
  },
  {
    path: 'acceptable-use-policy',
    title: 'Acceptable use policy',
  },
  {
    path: 'disclaimer',
    title: 'Disclaimer',
  },
  {
    path: 'return-policy',
    title: 'Return policy',
  },
  {
    path: 'refund-and-cancellation',
    title: 'Refund and cancellation',
  },
] as const;
