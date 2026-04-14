# DEMS - Dinkenesh Event Management System

DEMS is a full-stack event management and ticketing platform. It supports the full event lifecycle for attendees, organizers, staff/security teams, and platform admins.

The repository contains a React + Vite frontend and an Express + Prisma backend, with PostgreSQL as the primary database and Chapa integration for payments.

## Collaboration Summary

- Total contributors in git history: **30**
- Collaboration groups defined in [Instruction.md](Instruction.md): **3**
- Group branches:
	- `group-a-frontdoor` (frontend attendee journey and auth entry flows)
	- `group-b-control-room` (organizer/admin operations and finance controls)
	- `group-c-engine-room` (moderation, check-in engine, reviews, and platform core)

## What The Project Covers

### Attendee Experience
- Account registration and login
- Event discovery, filtering, and featured events
- Event detail pages with reviews and reporting
- Checkout and payment verification
- Digital ticket viewing and ticket list management

### Organizer Experience
- Organizer signup and dashboard
- Event creation and management
- Staff assignment and management
- Event analytics and CSV export
- Payout and platform fee workflows

### Admin / Staff / Security Operations
- Organizer approvals and admin management
- Event and category administration
- Staff dashboard and QR scanning/check-in
- Moderation pipeline for reports, bans, and appeals
- Notification handling and status workflows

## Tech Stack

### Frontend
- React 19
- Vite
- React Router
- Tailwind CSS
- Recharts (analytics)
- Leaflet + React Leaflet (maps)
- jsQR (scanner support)

### Backend
- Node.js + Express 5
- Prisma ORM + PostgreSQL
- JWT authentication and role-based authorization
- Chapa payment gateway integration
- Nodemailer template mail system
- Optional Redis hooks in configuration

## Backend Scope (Current Codebase)

- Route modules: **16**
- Controllers: **13**
- Services: **4**
- Middleware modules: **4**
- Mail templates: **11**
- Seed datasets: **12**

Main API domains include:
- Auth, Events, Categories, Tickets
- Staff scanning/check-in
- Reviews and replies
- Notifications
- Payments, payouts, and platform fees
- Organizer/admin analytics
- Moderation (reports, bans, appeals)

## Frontend Scope (Current Codebase)

- Page modules: **35**
- Component modules: **12**
- Context modules: **1** (`AuthContext`)
- Utility modules: **2**

The frontend exposes dedicated route experiences for public visitors, attendees, organizers, staff/security, and admins.

## Data Model Snapshot

The Prisma schema includes core models for:
- Identity and roles (`Role`, `User`, `OrganizerProfile`)
- Event catalog and ticketing (`EventCategory`, `Event`, `TicketType`, `DigitalTicket`)
- Commerce (`Order`, `OrderItem`, `PlatformFeePayment`, `Payout`)
- Operations (`StaffMember`, `CheckInLog`, `Notification`)
- Trust and moderation (`Review`, `ReviewReply`, `Report`, `Ban`, `Appeal`)

## Repository Structure

```text
.
├─ backend/        # Express API, Prisma schema, services, seed scripts
├─ frontend/       # React app (Vite), pages/components/contexts
├─ database/       # SQL scripts and schema snapshots
└─ Instruction.md  # Collaboration and commit matrix reference
```

## Local Development

### 1) Backend

```bash
cd backend
npm install
cp .env.example .env
npm run prisma:validate
npm run prisma:generate
npm run dev
```

Backend default URL: `http://localhost:5000`
Health endpoint: `http://localhost:5000/health`

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend default URL: `http://localhost:5173`

Set frontend environment variables as needed:

```env
VITE_API_URL=http://localhost:5000/api
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
```

## Notes

- The collaboration plan and contributor allocation are documented in [Instruction.md](Instruction.md).
- Backend package metadata describes the project as "Dinkenesh Event Management System Backend".
- The current git history confirms **30 unique contributors**.
