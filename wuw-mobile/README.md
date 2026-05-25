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
3. **iOS** : le projet inclut `App.entitlements` (push) et les hooks `AppDelegate` requis par Capacitor. Ajoutez `GoogleService-Info.plist` (Firebase → app iOS `com.winuwatch.wuwapp`) dans `ios/App/App/`, uploadez la clé APNs dans Firebase, puis `npm run build:prod && npx cap sync ios`. Ouvrez Xcode, vérifiez **Signing & Capabilities → Push Notifications**, et lancez sur un appareil physique (les push ne fonctionnent pas sur le simulateur).
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
npm run ios:sync
npx cap open ios
```

**Crash iOS au lancement** : ne copiez **pas** `GoogleService-Info.plist.example` (valeurs `YOUR_IOS_*` → Firebase plante). Téléchargez le vrai plist depuis Firebase → `ios/App/App/GoogleService-Info.plist`, puis `npm run ios:sync`. Vérifier : `npm run ios:firebase-setup`.

## Publication sur le Google Play Store

### Prérequis

1. **Compte Google Play Developer** — [play.google.com/console](https://play.google.com/console) (frais unique ~25 USD).
2. **Android Studio** — installe le JDK et le SDK Android. Sur Windows, le SDK est généralement dans `%LOCALAPPDATA%\Android\Sdk`.
3. **Backend production** — `.env.production` pointe déjà vers `VITE_API_BASE_URL=https://wuw-backend.onrender.com`.
4. **Firebase** (notifications push) — projet `winuwatch-bd56d` : `google-services.json` dans `android/app/`, et pour iOS ajoutez `GoogleService-Info.plist` dans `ios/App/App` (Xcode). **Android** : token FCM via `PushNotifications` (`registration`). **iOS** : `@capacitor-community/fcm` (`getToken`) — pas le token APNs seul de Capacitor.

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

## Limites actuelles

Le parcours consumer s’appuie sur les API `v1` du backend Next.js. Les paiements et l’auth (OTP email) nécessitent un backend configuré. Les notifications push nécessitent Firebase + secrets cron côté serveur (voir ci-dessus).
