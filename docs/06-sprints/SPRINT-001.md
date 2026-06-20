# Sprint 001 - Core Infrastructure Refactor

Status: Ready

---

# Goal

Refactor the existing project foundation according to the official Hanbey Fleet architecture and documentation.

This sprint does NOT implement business features.

The objective is to prepare a clean, scalable, production-ready foundation.

---

# Required Reading

Before making any change read:

docs/00-project/PROJECT_CHARTER.md

docs/00-project/PRODUCT_VISION.md

docs/01-business/BUSINESS_RULES.md

docs/02-architecture/DOMAIN_MODEL.md

docs/03-database/DATABASE_DESIGN.md

CLAUDE.md

---

# Scope

Only infrastructure.

Do NOT implement:

- Vehicle CRUD
- Driver CRUD
- Shift CRUD
- Expenses
- Reports
- Dashboard

---

# Objectives

## 1. Review Project Structure

Review the current monorepo.

Keep only folders that make sense.

Follow this structure:

apps/
packages/

Do not introduce unnecessary packages.

---

## 2. Backend Foundation

Review NestJS architecture.

Verify:

- ConfigModule
- ValidationPipe
- Global Exception Filter
- Global Response Interceptor
- Logger
- Environment validation

Improve if necessary.

---

## 3. Shared Packages

Review packages.

Only create packages when they provide real value.

Examples:

packages/shared

packages/types

Do NOT create empty packages.

---

## 4. Prisma Foundation

Review the Prisma schema.

Do NOT implement all entities yet.

Only prepare the infrastructure.

Verify:

UUID strategy

timestamps

indexes

soft delete strategy

naming consistency

---

## 5. Code Quality

Review:

folder names

module names

DTO naming

Service naming

Repository naming

Entity naming

Remove inconsistencies.

---

## 6. Development Rules

Ensure:

No business logic inside controllers.

No Prisma access inside controllers.

Services remain thin and readable.

Dependency Injection follows NestJS best practices.

---

## 7. Error Handling

Create a consistent error handling strategy.

All API responses should follow the same format.

---

## 8. Validation

Review DTO validation.

Use class-validator consistently.

Avoid duplicated validation logic.

---

## 9. Configuration

Review environment variables.

Validate required variables at startup.

Application should fail fast if configuration is invalid.

---

## 10. Logging

Implement or improve logging.

Do not use console.log inside application code.

---

# Constraints

Do not break the current project.

Do not remove working features.

Refactor only where necessary.

Keep changes incremental.

Avoid over engineering.

---

# Deliverables

At the end of this sprint provide:

1. Summary of changes

2. Architecture improvements

3. Remaining technical debt

4. Suggestions for Sprint 002

Do not implement business modules.

Only prepare the foundation.
