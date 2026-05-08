# Winuwatch Mobile

Frontend mobile separe pour Winuwatch, base sur React, Vite, TypeScript et Capacitor.

Ce projet reprend la structure fonctionnelle consumer du projet web Next.js, sans copier les dependances Next.js, Prisma ou server-only.

## Prerequis

- Node.js et npm
- Android Studio pour Android
- Xcode pour iOS, uniquement sur macOS

## Environnement

Copier `.env.example` vers `.env` puis adapter l'URL quand le backend mobile sera pret.

```bash
VITE_API_BASE_URL=https://api.example.com
```

## Developpement web

```bash
npm run dev
```

## Build web mobile

```bash
npm run build
```

Le build Vite est genere dans `dist`, qui est le `webDir` configure pour Capacitor.

## Synchroniser Capacitor

```bash
npx cap sync
```

## Ouvrir Android

```bash
npx cap open android
```

## Ouvrir iOS

```bash
npx cap open ios
```

## Structure

- `src/app` : racine React et styles globaux mobile
- `src/routes` : configuration de routes et helpers de locale
- `src/pages` : ecrans applicatifs organises par domaine
- `src/features` : composants metier reutilisables
- `src/components` : composants UI reutilisables
- `src/services` : services techniques, dont le futur client API
- `src/data` : mocks V1 inspires du projet source
- `src/lib` : constantes et utilitaires
- `src/types` : types partages
- `src/hooks` : hooks React reutilisables

## Routes V1

Routes principales reprises du projet source :

- `/{locale}` -> Home
- `/{locale}/login` -> Login
- `/{locale}/verification` -> Verification
- `/{locale}/competitions` -> Competitions
- `/{locale}/competitions/:id` -> Competition detail
- `/{locale}/competitions/:id/:orderId` -> Checkout
- `/{locale}/competitions/:id/:orderId/confirmation` -> Confirmation
- `/{locale}/competitions/:id/:orderId/error` -> Payment error
- `/{locale}/account/dashboard` -> Account dashboard
- `/{locale}/account/profile` -> Account profile
- `/{locale}/account/history` -> Account history
- `/{locale}/account/referrals` -> Account referrals
- `/{locale}/winners` -> Winners

Routes support et legales conservees en skeletons :

- `/{locale}/about-us`
- `/{locale}/howtoplay`
- `/{locale}/faq`
- `/{locale}/contact-us`
- `/{locale}/engagement`
- `/{locale}/privacy-policy`
- `/{locale}/terms-and-conditions`
- `/{locale}/acceptable-use-policy`
- `/{locale}/disclaimer`
- `/{locale}/return-policy`
- `/{locale}/refund-and-cancellation`

## Limites actuelles

Cette V1 utilise des donnees mockees et ne contient pas encore d'authentification reelle, de backend reel, de notifications push ou de paiement. Le dashboard admin web, les API routes et les webhooks restent exclus de l'app mobile consumer.
