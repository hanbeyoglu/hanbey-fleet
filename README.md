# TaxiLedger

A production-ready taxi vehicle operations and accounting system. Tracks vehicles, drivers, daily settlements, HGS toll transits, expenses, maintenance records, and generates monthly financial summaries.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS + TypeScript |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Cache/Queue | Redis 7 |
| Frontend | React 18 + Vite |
| UI | Tailwind CSS + shadcn/ui |
| Auth | JWT (access + refresh tokens) |
| Infra | Docker Compose |
| Monorepo | pnpm workspaces + Turborepo |

## Project Structure

```
taxiledger/
├── apps/
│   ├── api/          # NestJS REST API
│   └── admin/        # React admin dashboard
├── packages/
│   └── shared/       # Shared types and utilities
├── docker-compose.yml
└── turbo.json
```

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- Docker & Docker Compose

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url>
cd taxiledger
pnpm install
```

### 2. Set up environment

```bash
cp .env.example .env
# Edit .env with your values
```

Also copy the API env file:

```bash
cp apps/api/.env.example apps/api/.env
```

### 3. Start infrastructure

```bash
docker compose up -d
```

### 4. Run database migrations

```bash
pnpm db:migrate
pnpm db:generate
```

### 5. Start development servers

```bash
pnpm dev
```

- API: http://localhost:3000
- Swagger: http://localhost:3000/api/docs
- Admin: http://localhost:5173

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login |
| POST | /auth/refresh | Refresh token |
| GET | /auth/me | Current user |

### Vehicles
| Method | Path | Description |
|--------|------|-------------|
| GET | /vehicles | List vehicles |
| POST | /vehicles | Create vehicle |
| GET | /vehicles/:id | Get vehicle |
| PATCH | /vehicles/:id | Update vehicle |
| DELETE | /vehicles/:id | Soft delete vehicle |

### Drivers
| Method | Path | Description |
|--------|------|-------------|
| GET | /drivers | List drivers |
| POST | /drivers | Create driver |
| GET | /drivers/:id | Get driver |
| PATCH | /drivers/:id | Update driver |
| DELETE | /drivers/:id | Soft delete driver |

### Settlements
| Method | Path | Description |
|--------|------|-------------|
| GET | /settlements | List settlements |
| POST | /settlements | Create settlement |
| GET | /settlements/:id | Get settlement |
| PATCH | /settlements/:id | Update settlement |

### Expenses
| Method | Path | Description |
|--------|------|-------------|
| GET | /expenses | List expenses |
| POST | /expenses | Create expense |
| GET | /expenses/:id | Get expense |
| PATCH | /expenses/:id | Update expense |
| DELETE | /expenses/:id | Soft delete expense |

### Maintenance
| Method | Path | Description |
|--------|------|-------------|
| GET | /maintenance | List records |
| POST | /maintenance | Create record |
| GET | /maintenance/:id | Get record |
| PATCH | /maintenance/:id | Update record |
| DELETE | /maintenance/:id | Soft delete record |

### HGS Transits
| Method | Path | Description |
|--------|------|-------------|
| GET | /hgs | List transits |
| POST | /hgs | Create transit |
| GET | /hgs/:id | Get transit |

### Reports
| Method | Path | Description |
|--------|------|-------------|
| GET | /reports/monthly | Monthly summary |
| GET | /reports/vehicle/:id | Vehicle report |

## Roles

| Role | Permissions |
|------|-------------|
| OWNER | Full access |
| ADMIN | Manage vehicles, drivers, settlements, expenses |
| DRIVER | View own settlements and assignments |

## Database Schema

See `apps/api/prisma/schema.prisma` for the full Prisma schema.

## HGS Integration

The `HgsModule` is prepared for future İş Bankası API integration. The service contains stub methods (`syncFromBank`, `fetchBankTransits`) that will be implemented once API credentials are available. Configure `HGS_API_KEY` and `HGS_API_SECRET` in `.env` when ready.

## Running Tests

```bash
pnpm test
```

## Building for Production

```bash
pnpm build
```

## License

MIT
