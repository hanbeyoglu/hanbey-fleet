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
- Assignments

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

- Alerts
- Reminders
- Future notifications

⸻

Aggregate Roots

The following entities are Aggregate Roots.

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

ShiftStarted

ShiftCompleted

DriverReportSubmitted

DriverReportApproved

ExpenseCreated

MaintenanceCompleted

HgsImported

VehicleStatusChanged

NotificationCreated

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
