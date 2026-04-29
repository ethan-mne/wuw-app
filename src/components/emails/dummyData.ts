import { baseUrl } from './base-url';

export const confirmationAndGiftEmailData = {
  userName: 'Laurent',
  code: 'XCJKHM26',
  ticketDetails: {
    competitionImage: `${baseUrl}/new-images/rolex-submariner.webp`,
    competitionName: 'ROLEX SUBMARINER KERMIT STARBUCKS 16610LV',
    competitionDate: new Date(),
    orderId: 'B598BF6D-9B91-447C-9846-2897AE4579AB',
    orderDetails: [
      {
        quantity: 1,
        ticketValue: 30,
        ticketNumber: 'CLQNF9OQX0000MVRGEK3YJR2Q',
      },
    ],
  },
};

export const winnersEmailData = {
  userName: 'Angelo Fico',
  countryCode: 'FR',
  competitionNumber: 18,
  liveDrawLink: `${baseUrl}/competitions`,
  watchImage: `${baseUrl}/new-images/rolex-submariner.webp`,
  watchName: 'ROLEX DAYTONA CHRONOGRAPH',
  nextWatchName: 'ROLEX SKY-DWELLER 42MM WINNER CHOOSE COLOR',
  nextWatchImage: `${baseUrl}/new-images/rolex-submariner.webp`,
  nextWatchMaxTickets: 800,
  nextWatchValue: 25000,
  nextWatchEntryPrice: 35000,
};
