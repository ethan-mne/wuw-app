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
- `POST /api/mobile/v1/competitions/:id/draw-alert` (Bearer — body `{ token, platform, apnsEnvironment? }` — abonnement + enregistrement push atomiques)
- `DELETE /api/mobile/v1/competitions/:id/draw-alert` (Bearer — se désabonner)
- `POST /api/mobile/v1/auth/send-otp`
- `POST /api/mobile/v1/auth/verify-otp`
- `GET /api/mobile/v1/me`
- `PUT /api/mobile/v1/me`
- `GET /api/mobile/v1/me/summary`
- `GET /api/mobile/v1/orders/history`
- `POST /api/mobile/v1/me/push-token` (Bearer — enregistre le token push : APNs sur iOS, FCM sur Android)
- `DELETE /api/mobile/v1/me/push-token` (Bearer — retire le token)
- `GET /api/mobile/v1/winners?skip=0&take=20`

La route `GET /api/mobile/v1/winners` est la route de reference pour le mobile.
Configurez `VITE_API_BASE_URL` vers un backend qui expose bien ces routes `v1`.

### Notifications push (rappel tirage)

1. **Android** : Firebase Cloud Messaging — `google-services.json` dans `android/app/`. Backend : `FIREBASE_SERVICE_ACCOUNT_JSON`.
2. **iOS (APNs direct)** : plus de `GoogleService-Info.plist` ni Firebase SDK dans l’app. Capacitor enregistre le token APNs (64 hex) et le backend envoie via **APNs HTTP/2** avec la clé `.p8` Apple :
   - [Apple Developer](https://developer.apple.com/account/resources/authkeys/list) → clé **APNs Auth Key** (.p8), noter Key ID + Team ID
   - Sur Render : `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_KEY_P8` (PEM sur une ligne, `\n` échappés), `APNS_BUNDLE_ID=com.winuwatch.wuwapp`, `APNS_PRODUCTION=true` (TestFlight/App Store)
3. **Backend commun** : `CRON_SECRET` ou `DRAW_REMINDER_CRON_SECRET`. Route planifiée : `GET /api/cron/draw-reminders` (en-tête `Authorization: Bearer …`). Health : `GET /api/health` → `push.apnsConfigured` / `push.pushConfigured`.
4. **iOS build** : `App.entitlements` (push dev) + `AppRelease.entitlements` (production). `npm run ios:sync` pour TestFlight (production APNs). Pour tests Xcode **Debug**, utiliser `npm run ios:sync:dev` (sandbox APNs via `.env.development`).
5. Après connexion OTP, l’app enregistre le token sur `POST /api/mobile/v1/me/push-token`. **Remind me** enregistre token + abonnement tirage.

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
npm run ios:sync
npx cap open ios
```

**iOS Archive** : `npm run build:prod && npm run ios:sync`, ouvrir Xcode, vérifier **Signing & Capabilities → Push Notifications**, Archive pour TestFlight.

### Erreurs de build Xcode

| Erreur | Action |
|--------|--------|
| `Failed to build module 'Capacitor'` (Swift 6.2 vs 6.3) | Sur le Mac : dans Xcode **File → Packages → Reset Package Caches**, **Clean Build Folder**, supprimer DerivedData, `npm install && npm run ios:sync`, rouvrir le workspace. |

## Publication sur le Google Play Store

### Prérequis

1. **Compte Google Play Developer** — [play.google.com/console](https://play.google.com/console) (frais unique ~25 USD).
2. **Android Studio** — installe le JDK et le SDK Android. Sur Windows, le SDK est généralement dans `%LOCALAPPDATA%\Android\Sdk`.
3. **Backend production** — `.env.production` pointe déjà vers `VITE_API_BASE_URL=https://wuw-backend.onrender.com`.
4. **Firebase (Android push only)** — `google-services.json` dans `android/app/`. **iOS** : token APNs via Capacitor `PushNotifications` (64 hex), envoi direct depuis le backend (`APNS_*` sur Render).

### 1. Clé de signature (upload keystore)

Une seule fois, générez un keystore (conservez-le en lieu sûr — Google ne peut pas le récupérer) :

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore wuw-mobile/android/release.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

Copiez `android/keystore.properties.example` vers `android/keystore.properties` et renseignez les mots de passe.

### 2. Build de production (AAB)

Le Play Store exige un **Android App Bundle** (`.aab`), pas un APK :

```bash
cd wuw-mobile
npm run android:release
```

Le fichier généré se trouve dans :

`android/app/build/outputs/bundle/release/app-release.aab`

Sans `keystore.properties`, Gradle produit un bundle non signé — utilisez **Build → Generate Signed Bundle** dans Android Studio à la place.

### 3. Google Play Console

1. **Créer l’application** — nom « Winuwatch », langue par défaut, type « Application ».
2. **Fiche Play Store** — description courte/longue, icône 512×512, captures d’écran téléphone (min. 2), catégorie.
3. **Politique de confidentialité** — URL publique (ex. `https://winuwatch.uk/en/privacy-policy`).
4. **Classification du contenu** — questionnaire obligatoire.
5. **Cible d’audience** — tranche d’âge (applications avec paiements / concours : souvent 18+).
6. **Sécurité des données** — déclaration des données collectées (email, achats, identifiants push, etc.).
7. **Signature Play App Signing** — à la première upload, Google propose d’héberger la clé de signature ; acceptez et uploadez votre AAB signé avec la clé *upload*.

Publiez d’abord en **test interne** ou **test fermé** pour valider l’app avant la production.

### 4. Versions suivantes

Avant chaque release, incrémentez dans `android/app/build.gradle` :

- `versionCode` — entier strictement croissant (ex. 2, 3…)
- `versionName` — version affichée (ex. `"1.0.1"`)

Puis relancez `npm run android:release`.

### Note réglementaire

Winuwatch propose des concours avec paiement. Google applique des règles strictes sur les **jeux d’argent / loteries**. Vérifiez que vous respectez la [politique Real-Money Gambling](https://support.google.com/googleplay/android-developer/answer/9877032) pour votre marché (licences UK, etc.) — un refus est possible sans documentation adaptée.

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

## Déploiement push iOS (APNs direct) — checklist

1. **Apple Developer** : créer/télécharger une clé APNs Auth (.p8), noter Key ID + Team ID (la clé Firebase Console n’est pas exportable).
2. **Render** : ajouter `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_KEY_P8`, `APNS_BUNDLE_ID=com.winuwatch.wuwapp`, `APNS_PRODUCTION=true`, plus `DRAW_REMINDER_CRON_SECRET` (et `FIREBASE_SERVICE_ACCOUNT_JSON` pour Android).
3. **Backend** : déployer, puis `npm run push:debug:prod` → `push.apnsConfigured: true`.
4. **DB** : `pnpm db:push` (colonne `apnsEnvironment` sur `user_push_device`).
5. **Mac** : `cd wuw-mobile && npm run ios:sync`, Archive TestFlight.
6. **iPhone** : login → Remind me → token 64 hex en base.
7. **Test** : `npm run draw-reminder:test:prod -- --user-id=... --competition-id=...`

## Limites actuelles

Le parcours consumer s’appuie sur les API `v1` du backend Next.js. Les paiements et l’auth (OTP email) nécessitent un backend configuré. Les notifications push nécessitent Firebase + secrets cron côté serveur (voir ci-dessus).
