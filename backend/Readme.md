# DEMS Backend API

## Dinkenesh Event Management System - Backend

### Tech Stack
- Node.js + Express
- PostgreSQL with Prisma ORM
- JWT Authentication
- Redis (available for queues)
- Nodemailer with centralized template-based mail service

### Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Configure PostgreSQL connection and ensure database exists:
```bash
# Example DATABASE_URL
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/dems_db
```

4. Validate and generate Prisma client:
```bash
npm run prisma:validate
npm run prisma:generate
```

5. Start development server:
```bash
npm run dev
```

### Prisma Workflow

- Prisma schema: `prisma/schema.prisma`
- Prisma config: `prisma.config.ts`
- Client export: `config/database.js`

Useful commands:
```bash
npm run prisma:format
npm run prisma:validate
npm run prisma:generate
npm run prisma:pull
npm run prisma:studio
```

### Global Email System

- Transport config: `config/email.js`
- Global sender utility: `services/mailService.js`
- Scenario templates: `mail_templates/`

Current templates include:
- User registration welcome
- Organizer application received
- Organizer approval/rejection update
- Account status update (including blocked/suspended/rejected)
- Password reset
- Staff invitation
- Ticket purchase confirmation
- Event reminder

To add a new email scenario:
1. Create a new template module in `mail_templates/` returning `{ subject, text, html }`.
2. Export it in `mail_templates/index.js`.
3. Call `sendTemplateEmail({ to, template, payload })` from business logic.

### Notes

- Legacy raw SQL and Sequelize runtime access have been replaced with Prisma in active controllers/services.
- Existing API response field names are kept in snake_case where frontend compatibility depends on them.