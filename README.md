
# Daret Digital

A full-stack platform to digitize **daret** (tontine) management, the traditional rotating savings system widely used in Morocco. Members contribute a fixed amount each turn, and each turn one member receives the pot. Daret Digital replaces notebooks and WhatsApp messages with a transparent, trackable app, available on the web and as a mobile app.

## Demo

<!-- TODO: add the video link, e.g. [Watch the 3 minute walkthrough](https://youtu.be/...) -->

## Screenshots

<!-- TODO: add screenshots: group page with members, payments panel, receipt PDF, and the mobile app (dashboard, daret detail) -->

## Features

- **JWT authentication** with a dynamic role model: a new user has no role, and becomes the **organizer** of any daret group they create. Other participants are **members** of that group.
- **Daret groups** with a status lifecycle (`EN_ATTENTE`, `ACTIVE`, `TERMINEE`), a current-turn tracker, and edit/delete while the group is still waiting.
- **Invitations:** share an invite code, or let the organizer add members by email. The organizer can also remove members before the group starts.
- **Manual turn order:** the organizer assigns each member's position.
- **Member contact details:** the organizer can view a member's phone and IBAN, to organize payouts.
- **Payments per turn:** payments are generated for each member, with statuses `PENDING`, `PAID`, `VALIDATED` and `LATE`.
- **Card payments with Stripe Checkout** (test mode), confirmed through a webhook. The UI polls briefly after the payment page is closed until the payment shows as validated.
- **Optional manual declaration** (cash or transfer), validated by the organizer. Enabled with a feature flag.
- **Payouts:** once all payments are validated, the organizer confirms the payout to the turn's beneficiary and closes the turn.
- **PDF receipts:** generated on the client (in the browser on the web, on the device on mobile) for every validated payment, downloadable or shareable by the member and by the organizer.
- **Profile page** to manage personal details (including phone and IBAN, with IBAN validation) and change the password.
- **Mobile app (React Native, Expo):** the same features on iOS and Android, with bottom-tab navigation, secure token storage, pull to refresh and the native share sheet for receipts.

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot, Spring Security, Spring Data JPA |
| Auth | JWT |
| Database | PostgreSQL |
| Payments | Stripe Checkout and webhooks |
| Web frontend | Next.js, React, TypeScript, Tailwind CSS |
| Mobile app | React Native, Expo, Expo Router, TypeScript |
| PDF | jsPDF (web), expo-print and expo-sharing (mobile) |
| Deployment | Docker, Docker Compose |

## Roles

| Role | Can do |
|---|---|
| Organizer | Create and edit a group, invite or remove members, set the turn order, validate payments, confirm payouts, close turns, view member contact details |
| Member | View the group, members and turn order, pay their contribution, download their receipts |

## Getting started

### Option 1: Docker Compose (recommended)

Prerequisite: Docker Desktop running.

```bash
git clone https://github.com/khadija-ELBACHOURI/daret-digital.git
cd daret-digital
cp .env.example .env     # then fill in the values
docker compose up --build
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

- Frontend: http://localhost:3000
- API: http://localhost:8080

### Environment variables

| Variable | Description |
|---|---|
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | PostgreSQL credentials |
| `JWT_SECRET` | Base64 secret of at least 32 bytes (HS256 requires 256 bits) |
| `STRIPE_SECRET_KEY` | Stripe **test** secret key (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_...`) |
| `MANUAL_PAYMENTS` | `true` to enable cash/transfer declaration |
| `API_URL` | Backend URL as seen by the browser |
| `FRONTEND_URL` | Frontend URL, used for CORS and Stripe redirects |

Generate a valid JWT secret:

```bash
openssl rand -base64 32
```

### Stripe in test mode

Use the test card `4242 4242 4242 4242`, any future expiry date, any CVC. Never use a real card.

Stripe cannot reach `localhost`, so forward webhooks with the Stripe CLI and copy the `whsec_...` secret it prints into `.env`:

```bash
stripe listen --api-key sk_test_xxx --events checkout.session.completed,checkout.session.async_payment_succeeded --forward-to localhost:8080/api/stripe/webhook
```

### Option 2: Run without Docker

Prerequisites: Java 21, Node.js 22, PostgreSQL.

```bash
# Backend: set the same variables as above, then
cd backend
./mvnw spring-boot:run

# Frontend
cd frontend
npm install
npm run dev
```

The frontend reads `NEXT_PUBLIC_API_URL` (and optionally `NEXT_PUBLIC_MANUAL_PAYMENTS=true`) from `.env.local`.

### Option 3: Mobile app (Expo Go)

Prerequisites: Node.js 22, the backend running, and the **Expo Go** app on your phone (free, on the App Store and Google Play). The phone and the computer must be on the same Wi-Fi network.

```bash
cd daret-app
npm install
cp .env.example .env     # then set your computer's local IP
npx expo start
```

Scan the QR code with Expo Go (Camera app on iOS, Expo Go on Android).

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | Backend URL reachable from the phone, e.g. `http://192.168.1.23:8080` (`localhost` does not work on a phone) |
| `EXPO_PUBLIC_MANUAL_PAYMENTS` | `true` to show the manual cash/transfer declaration, must match the backend flag |

Find your local IP with `ipconfig` on Windows or `ipconfig getifaddr en0` on macOS. After editing `.env`, restart with `npx expo start --clear`.

## Project structure

```
daret-digital/
├── backend/             # Spring Boot API (auth, groups, payments, payouts)
├── frontend/            # Next.js web app
├── daret-app/           # React Native (Expo) mobile app
│   └── src/
│       ├── app/         # Expo Router screens (auth, tabs, daret detail)
│       ├── components/  # Shared UI, forms, payments panel
│       └── lib/         # API client, auth context, IBAN helpers, receipts
├── docker-compose.yml
└── .env.example
```

## Roadmap

- Automatic payment reminders (email, WhatsApp, mobile push notifications)
- Deep link back into the mobile app after a Stripe payment
- Payment proof upload for manual payments
- Full payment history and balance export per member
- API documentation (OpenAPI) and CI pipeline
- Production build of the mobile app (EAS Build)

## Author

**Khadija El Bachouri**
[LinkedIn](https://linkedin.com/in/khadija-elbachouri) | [GitHub](https://github.com/khadija-ELBACHOURI) | [Portfolio](https://hadijaelbachouri.me)