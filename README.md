# Retain — Personal Expense & Budget Manager

A full-stack web application for managing personal expenses and monthly budgets.

**Live App:** _coming soon_

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| State (auth) | React Context |
| State (filters) | Redux Toolkit |
| Backend | Node.js, Express |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT (access + refresh tokens) |

## Project Structure

```
retain/
├── apps/
│   ├── api/   — Express + Prisma backend
│   └── web/   — React + Vite frontend
└── package.json
```

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure backend environment
```bash
cd apps/api
copy .env.example .env
```
Edit `.env` with your PostgreSQL credentials.

### 3. Run database migrations
```bash
npm run db:migrate
```

### 4. Seed the database
```bash
npm run db:seed
```
Creates default categories and an admin account:
- Email: `admin@retain.app`
- Password: `Admin@1234`

### 5. Start the backend
```bash
npm run dev:api
```
API runs at `http://localhost:4000`

### 6. Start the frontend
```bash
npm run dev:web
```
App runs at `http://localhost:5173`

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /api/auth/register | Register a new user | Public |
| POST | /api/auth/login | Login | Public |
| POST | /api/auth/refresh | Refresh access token | Public |
| GET | /api/expenses | List user expenses (filterable) | User |
| POST | /api/expenses | Create expense | User |
| PUT | /api/expenses/:id | Update expense | User |
| DELETE | /api/expenses/:id | Delete expense | User |
| GET | /api/budgets/:month | Get budget for a month | User |
| PUT | /api/budgets/:month | Set/update budget | User |
| GET | /api/categories | List all categories | User |
| POST | /api/admin/categories | Create category | Admin |
| PUT | /api/admin/categories/:id | Update category | Admin |
| DELETE | /api/admin/categories/:id | Delete category | Admin |
| GET | /api/admin/insights | Platform insights | Admin |

## Features

- User authentication (sign up, sign in, sign out)
- Role-based access (USER / ADMIN)
- Expense CRUD with category, payment method, date, notes
- Monthly budget tracking with spending status
- User dashboard with spending summaries
- Expense filtering, searching, and sorting (Redux)
- Admin dashboard with platform insights and category management
- Responsive UI
