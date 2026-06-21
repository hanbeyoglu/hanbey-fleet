Domain Model

Status: Draft
Version: 1.0.0
Owner: Cabir Han Beyoğlu
Last Updated: 2026-06-20

⸻

Overview

This document defines the core business domain of Hanbey Fleet.

It identifies the main entities, aggregate roots, value objects, relationships, and domain events.

The domain model is independent from implementation details such as NestJS, Prisma, PostgreSQL or React.

⸻

Domain Philosophy

Hanbey Fleet is designed around real-world operations, not database tables.

The domain reflects how a taxi owner thinks about their business.

Everything starts with a Shift.

A shift generates reports, expenses, HGS records and timeline events.

⸻

Bounded Contexts

The application is divided into the following business domains.

Fleet Management

Responsible for:

- Vehicles
- Vehicle Status
- Vehicle Information

⸻

Driver Management

Responsible for:

- Drivers
- Driver Accounts
- Vehicle Assignments (independent from Shifts)

⸻

Operations

Responsible for:

- Shifts
- Driver Reports
- Daily Operations

⸻

Financial

Responsible for:

- Expenses
- Monthly summaries
- Profit calculation

⸻

Toll Management

Responsible for:

- HGS synchronization
- Toll records
- Toll validation

⸻

Maintenance

Responsible for:

- Maintenance history
- Vehicle health
- Scheduled maintenance

⸻

Notification

Responsible for:

- Alerts requiring user action
- Maintenance and warranty reminders
- Settlement mismatch alerts
- Missing driver report alerts

Notifications are created automatically by `ReminderService` or domain workflows (e.g. settlement creation). They are independent from Timeline.

Workflow:

1. Business event or scheduled reminder check triggers notification creation
2. Notification is assigned to fleet managers (OWNER, ADMIN)
3. User reads notification from admin panel
4. User marks notification as read (optional: mark all as read)
5. Notification is soft-deleted when dismissed (never hard deleted)

Reminder checks are executed by SchedulerService on configured cron schedules.

⸻

Scheduler

Responsible for:

- Orchestrating recurring automation tasks
- Executing reminder checks on schedule
- Running HGS sync stub
- Archiving old completed imports

SchedulerService contains no business rules. It only orchestrates:

- ReminderService
- HgsService
- ImportService

Job state (last run, duration, errors) is kept in memory. Execution logs use NestJS Logger only.

Schedules:

- Every hour — runAllChecks, missing driver reports
- Every 30 minutes — settlement mismatch
- Daily 02:00 — HGS sync stub
- Daily 03:00 — import cleanup (90-day archive)
- Daily 08:00 — maintenance reminders
- Daily 09:00 — warranty reminders

Manual execution reuses the same orchestration methods as cron jobs.

⸻

Document

Responsible for:

- Legal and compliance document metadata for vehicles and drivers
- Version history through immutable revisions
- Expiry tracking and compliance visibility

Workflow:

1. Document created with owner, type, dates and initial file metadata revision
2. Status computed from expiryDate (VALID / EXPIRING / EXPIRED)
3. New file version creates immutable DocumentRevision
4. Expiring documents trigger DOCUMENT_EXPIRING notifications
5. Expired documents surface on Dashboard
6. Soft delete preserves audit trail via revisions

File storage is metadata-only in this sprint. No S3, MinIO or local uploads.

⸻

Import

Responsible for:

- Receiving raw driver declarations from external sources
- Parsing and validating imported content
- Creating DriverReport from successful imports
- Maintaining import history

Sources (simulated in current sprint):

- MANUAL — raw text input
- OCR — simulated OCR text (no real OCR provider)
- WHATSAPP — simulated WhatsApp payload (no real WhatsApp provider)

Workflow:

1. Import request received via API
2. ImportJob created with raw content stored
3. ParserService extracts shift, revenue, HGS and notes
4. On parse failure → ImportJob FAILED
5. On shift conflict → ImportJob FAILED + Conflict response
6. On success → DriverReport created within transaction
7. Timeline event DRIVER_REPORT_IMPORTED generated
8. ImportJob marked COMPLETED with driverReportId reference

ParserService is pure business logic with no database access.

⸻

Aggregate Roots

The following entities are Aggregate Roots.

VehicleAssignment

Represents the relationship between a vehicle and a responsible driver
over a period of time that may span multiple shifts.

An assignment is independent from Shift. A driver may be assigned
to a vehicle for days while multiple shifts are created during that period.

Status (ACTIVE/RELEASED) is computed from releasedAt: null = ACTIVE, set = RELEASED.

Assignments are immutable (BR-124). They can only be released, never deleted.

Vehicle

The most important entity.

Represents a physical vehicle.

Owns:

- Current Shift
- Timeline
- Expenses
- Maintenance History
- HGS Records

⸻

Shift

Represents one operational period.

Every operational activity belongs to a Shift.

Owns:

- Driver Report
- Expenses
- HGS Matching

⸻

Driver

Represents a person operating a vehicle.

⸻

Entities

Vehicle

Represents a physical taxi.

Properties include:

- Plate Number
- Brand
- Model
- Current Mileage
- Current Status

⸻

Driver

Represents a taxi driver.

Properties include:

- Name
- Phone
- Driving License
- Status

⸻

Shift

Represents a driver’s working session.

Properties include:

- Planned Start
- Planned End
- Actual Start
- Actual End
- Status

Possible statuses:

- Planned
- Active
- Completed
- Cancelled

⸻

Driver Report

Represents information submitted by the driver.

Contains:

- Revenue
- Declared HGS
- Notes

⸻

HGS Transit

Represents one toll transaction imported from the bank.

Properties:

- Transit Time
- Toll Booth
- Amount
- Source

HGS records are read-only.

⸻

Expense

Represents money spent for a vehicle.

Expense Categories:

- Fuel
- Maintenance
- Insurance
- Tax
- Penalty
- Cleaning
- Parking
- Other

⸻

Maintenance Record

Represents technical information about vehicle maintenance.

Examples:

- Oil Change
- Brake Replacement
- Tire Replacement
- Battery
- Timing Belt

⸻

Timeline Event

Represents an automatically generated historical event.

Timeline Events cannot be manually created.

⸻

Value Objects

The following concepts should be modeled as Value Objects whenever appropriate.

- Money
- Plate Number
- Phone Number
- Mileage
- Shift Time
- Date Range

⸻

Domain Events

Examples:

VehicleCreated

VehicleAssigned

VehicleReleased

ShiftStarted

ShiftCompleted

DriverReportSubmitted

DriverReportImported

DriverReportApproved

ExpenseCreated

MaintenanceCompleted

HgsImported

VehicleStatusChanged

SettlementCreated

  SettlementApproved

DocumentUploaded

DocumentReplaced

DocumentDeleted

⸻

Relationships

Vehicle

↓

has many Shifts

↓

Shift

↓

belongs to one Driver

↓

Shift

↓

has one Driver Report

↓

Shift

↓

has many HGS Transits

↓

Vehicle

↓

has many Expenses

↓

Vehicle

↓

has many Maintenance Records

↓

Vehicle

↓

has many Timeline Events

⸻

Future Expansion

The domain model must support:

- Multi-company
- Multiple fleets
- Mobile applications
- AI Assistant
- OCR
- WhatsApp integration
- GPS Tracking
- Multi-language support

without structural redesign.

⸻

Design Principles

- Business first
- Technology independent
- Rich domain model
- Aggregate consistency
- Event-driven architecture
- Single source of truth
- Future-proof design

⸻

Out of Scope

This document intentionally excludes:

- Database schema
- REST API
- UI
- Authentication
- Infrastructure

Those concerns are documented separately.
