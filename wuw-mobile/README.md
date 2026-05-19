# Winuwatch Mobile

Frontend mobile separe pour Winuwatch, base sur React, Vite, TypeScript et Capacitor.

Ce projet reprend la structure fonctionnelle consumer du projet web Next.js, sans copier les dependances Next.js, Prisma ou server-only.

## Prerequis

- Node.js et npm
- Android Studio pour Android
- Xcode pour iOS, uniquement sur macOS

## Environnement

Copier `.env.example` vers `.env` puis pointer vers le backend local/remote.

```bash
VITE_API_BASE_URL=http://localhost:3000
```

## Developpement web

```bash
npm run dev
```

## Backend mobile dedie (in-repo)

Le backend mobile est expose par le projet `wuw-app` via des routes versionnees:

- `GET /api/mobile/v1/competitions`
- `GET /api/mobile/v1/competitions/:id`
- `GET /api/mobile/v1/competitions/:id/draw-alert` (Bearer — statut d’alerte tirage)
- `POST /api/mobile/v1/competitions/:id/draw-alert` (Bearer — s’abonner au rappel ~10 min avant)
- `DELETE /api/mobile/v1/competitions/:id/draw-alert` (Bearer — se désabonner)
- `POST /api/mobile/v1/auth/send-otp`
- `POST /api/mobile/v1/auth/verify-otp`
- `GET /api/mobile/v1/me`
- `PUT /api/mobile/v1/me`
- `GET /api/mobile/v1/me/summary`
- `GET /api/mobile/v1/orders/history`
- `POST /api/mobile/v1/me/push-token` (Bearer — enregistre le token FCM)
- `DELETE /api/mobile/v1/me/push-token` (Bearer — retire le token)
- `GET /api/mobile/v1/winners?skip=0&take=20`

La route `GET /api/mobile/v1/winners` est la route de reference pour le mobile.
Configurez `VITE_API_BASE_URL` vers un backend qui expose bien ces routes `v1`.

### Notifications push (rappel tirage)

1. **Firebase** : projet avec Cloud Messaging ; ajoutez `google-services.json` dans `android/app/` (le plugin Gradle est déjà en place si le fichier existe).
2. **Backend** : définissez `FIREBASE_SERVICE_ACCOUNT_JSON` (JSON compte de service sur une ligne) et `CRON_SECRET` ou `DRAW_REMINDER_CRON_SECRET` (même valeur que le secret Cron Vercel si vous utilisez Vercel Cron). La route planifiée : `GET /api/cron/draw-reminders` (en-tête `Authorization: Bearer …`).
3. **iOS** : dans Xcode, activez Push Notifications ; dans la console Firebase, associez la clé APNs pour que FCM livre sur iOS.
4. Après connexion OTP, l’app enregistre le token sur `POST /api/mobile/v1/me/push-token` (uniquement sur shell natif Capacitor).

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

Le parcours consumer s’appuie sur les API `v1` du backend Next.js. Les paiements et l’auth (OTP email) nécessitent un backend configuré. Les notifications push nécessitent Firebase + secrets cron côté serveur (voir ci-dessus).
