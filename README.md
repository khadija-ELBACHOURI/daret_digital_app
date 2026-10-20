# Daret Digital

A full-stack platform to digitize **daret** (tontine) management, the traditional rotating savings system widely used in Morocco. Members contribute a fixed amount each cycle, and each cycle one member receives the pot. Daret Digital replaces notebooks and WhatsApp messages with a transparent, trackable app.

> Status: in active development.

## Screenshots

<!-- TODO: add 2 or 3 screenshots (group page, turn order, admin dashboard) -->

## Features

### Implemented
- **JWT authentication** with a dynamic role model: a new user starts with no role and automatically becomes an **organizer** when they create a daret group.
- **Daret groups** with a status lifecycle (`EN_ATTENTE`, `ACTIVE`, `TERMINEE`) and a current-turn tracker.
- **Organizer tools:** add members, modify the group, and define the **turn order manually**.
- **Member view:** see the group, the members, and the turn order.
- **Admin dashboard** (Next.js, ADMIN role): entry point for group creation, member management, and payment validation.

### In progress
- **Payments:** a `Paiement` entity with statuses `EN_ATTENTE`, `PAYE`, `VALIDE`, `EN_RETARD`. Members pay, organizers validate, and the cycle advances to the next turn.
- Scheduled job to flag late payments.
- Endpoint to change group status (start and close a group).

### Roadmap
- Automatic reminders (email, WhatsApp)
- Payment proof upload
- PDF balance export
- Full payment history per member

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Spring Boot, Spring Security |
| Auth | JWT |
| Database | PostgreSQL |
| Frontend | Next.js, TypeScript |
| Deployment | Docker (multi-stage build for a lightweight backend image) |

## Roles

| Role | Can do |
|---|---|
| Organizer | Create a group, add members, set and modify the turn order, validate payments |
| Member | View the group, members and turn order, make payments |
| Admin | Manage groups, members and payments from the dashboard |

## Getting started


### Prerequisites
- Java 17+
- Node.js 18+
- PostgreSQL (or Docker)

### Backend
```bash
cd backend
# configure DB credentials and JWT secret in application.properties
./mvnw spring-boot:run
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Docker
```bash
docker build -t daret-digital-backend ./backend
docker run -p 8080:8080 daret-digital-backend
```

## Project structure

```
daret-digital/
├── backend/    # Spring Boot API (auth, groups, payments)
└── frontend/   # Next.js app (member views, admin dashboard)
```

## Author

**Khadija El Bachouri**
[LinkedIn](https://linkedin.com/in/khadija-elbachouri) | [GitHub](https://github.com/khadija-ELBACHOURI)
