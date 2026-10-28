# Daret Digital

A full-stack platform to digitize **daret** (tontine) management, the traditional rotating savings system widely used in Morocco. Members contribute a fixed amount each turn, and each turn one member receives the pot. Daret Digital replaces notebooks and WhatsApp messages with a transparent, trackable app.

## Demo

<!-- TODO: add the video link, e.g. [Watch the 3 minute walkthrough](https://youtu.be/...) -->

## Screenshots

<!-- TODO: add 3 screenshots: group page with members, payments panel, receipt PDF -->

## Features

- **JWT authentication** with a dynamic role model: a new user has no role, and becomes the **organizer** of any daret group they create. Other participants are **members** of that group.
- **Daret groups** with a status lifecycle (`EN_ATTENTE`, `ACTIVE`, `TERMINEE`), a current-turn tracker, and edit/delete while the group is still waiting.
- **Invitations:** share an invite code, or let the organizer add members by email. The organizer can also remove members before the group starts.
- **Manual turn order:** the organizer assigns each member's position.
- **Member contact details:** the organizer can view a member's phone and IBAN, to organize payouts.
- **Payments per turn:** payments are generated for each member, with statuses `PENDING`, `PAID`, `VALIDATED` and `LATE`.
- **Card payments with Stripe Checkout** (test mode), confirmed through a webhook. The UI polls briefly after the redirect until the payment shows as validated.
- **Optional manual declaration** (cash or transfer), validated by the organizer. Enabled with a feature flag.
- **Payouts:** once all payments are validated, the organizer confirms the payout to the turn's beneficiary and closes the turn.
- **PDF receipts:** generated in the browser for every validated payment, downloadable by the member and by the organizer.
- **Profile page** to manage personal details (including phone and IBAN) and change the password.

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot, Spring Security, Spring Data JPA |
| Auth | JWT |
| Database | PostgreSQL |
| Payments | Stripe Checkout and webhooks |
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| PDF | jsPDF (client side) |
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
stripe listen --forward-to localhost:8080/<your-webhook-path>
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

## Project structure

```
daret-digital/
├── backend/             # Spring Boot API (auth, groups, payments, payouts)
├── frontend/            # Next.js app
├── docker-compose.yml
└── .env.example
```

## Roadmap

- Automatic payment reminders (email, WhatsApp)
- Payment proof upload for manual payments
- Full payment history and balance export per member
- API documentation (OpenAPI) and CI pipeline

## Author

**Khadija El Bachouri**
[LinkedIn](https://linkedin.com/in/khadija-elbachouri) | [GitHub](https://github.com/khadija-ELBACHOURI)