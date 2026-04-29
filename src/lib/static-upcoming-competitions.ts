import { type CompetitionInterface } from './interfaces';

const imagePaths = [
  {
    url: '/images/static-upcoming-competitions/Patek Philippe AQUANAUT 5167A.png',
    price: 50000,
  },
  {
    url: '/images/static-upcoming-competitions/Patek philippe Nautilus.png',
    price: 95000,
  },
  {
    url: '/images/static-upcoming-competitions/Rolex Daytona Black Dial.png',
    price: 25000,
  },
  {
    url: '/images/static-upcoming-competitions/Rolex Daytona Panda 116519LN.png',
    price: 30000,
  },
  {
    url: '/images/static-upcoming-competitions/Rolex GMT Batman.png',
    price: 14000,
  },
  {
    url: '/images/static-upcoming-competitions/Rolex GMT PEPSI.png',
    price: 17000,
  },
  {
    url: '/images/static-upcoming-competitions/Rolex GMT SPRITE.png',
    price: 22000,
  },
  {
    url: '/images/static-upcoming-competitions/Rolex OYSTERFLEX Daytona Ghost.png',
    price: 25000,
  },
  {
    url: '/images/static-upcoming-competitions/Rolex SUBMARINER HULK.png',
    price: 30000,
  },
  {
    url: '/images/static-upcoming-competitions/Rolex SUBMARINER Starbucks.png',
    price: 28000,
  },
];

const static_competitions: CompetitionInterface[] = imagePaths.map(
  (image, index) => ({
    id: `comp-${index + 1}`,
    total_tickets: 1000,
    name: `Competition ${index + 1}`,
    end_date: new Date('2024-12-31'),
    price: image.price,
    ticket_price: 100,
    remaining_tickets: 950,
    status: 'OPEN',
    max_winners: 1,
    cash_alternative: null,
    Watches: {
      id: `watch-${index + 1}`,
      brand: image.url
        .substring(image.url.lastIndexOf('/') + 1, image.url.lastIndexOf('.'))
        .toUpperCase(),
      model: 'Model Example',
      reference_number: 'Ref123',
      movement: 'Automatic',
      Bracelet_material: 'Material Example',
      year_of_manifacture: 2020,
      caliber_grear: 123,
      number_of_stones: 20,
      glass: 'Glass Example',
      bezel_material: 'Material Example',
      has_box: true,
      has_certificate: true,
      condition: 'New',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-03-01'),
      images_url: [
        {
          id: `img-${index + 1}`,
          url: image.url,
          WatchesId: `watch-${index + 1}`,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-03-02'),
        },
      ],
    },
    _count: {
      Ticket: 50,
    },
    error: null,
  }),
);

export default static_competitions;
