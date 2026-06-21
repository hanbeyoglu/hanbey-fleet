Database Design

Status: Draft
Version: 1.0.0
Owner: Cabir Han Beyoğlu

⸻

Purpose

This document defines the logical database design of Hanbey Fleet.

It describes the entities, relationships, constraints and indexing strategy.

Technology-specific implementation is intentionally excluded.

⸻

General Principles

- UUID Primary Keys
- UTC timestamps
- Soft Delete
- Audit Fields
- Optimized for reporting
- Optimized for historical data
- No duplicated business data

⸻

Base Entity

Every table must contain:

- id
- createdAt
- updatedAt
- deletedAt
- createdBy
- updatedBy

⸻

Core Tables

users

Authentication and authorization.

⸻

drivers

Driver information.

One driver belongs to one user account.

⸻

vehicles

Stores physical vehicles.

One vehicle may have many shifts.

⸻

shifts

Represents one operational session.

Fields:

- vehicleId
- driverId
- plannedStart
- plannedEnd
- actualStart
- actualEnd
- status

⸻

driver_reports

Submitted by drivers.

Contains:

- shiftId
- revenue
- declaredHgs
- notes
- source

Source examples:

- Manual
- WhatsApp
- Mobile
- OCR

⸻

hgs_transits

Imported from bank API.

Contains:

- vehicleId
- shiftId
- transitTime
- tollBooth
- amount
- provider

Read Only.

⸻

expenses

Contains every financial expense.

Fields:

- vehicleId
- shiftId (nullable)
- category
- amount
- expenseDate
- note

Categories:

Fuel

Maintenance

Insurance

Tax

Penalty

Cleaning

Parking

Other

⸻

maintenance_details

Additional technical information.

Linked to:

Expense

Contains:

- expenseId
- maintenanceType
- mileage
- serviceCompany
- warrantyUntil
- nextMaintenanceMileage

⸻

timeline_events

Automatically generated.

Contains:

- vehicleId
- shiftId
- eventType
- eventTime
- payload

Never manually edited.

⸻

notifications

Stores user notifications.

⸻

attachments

Stores uploaded files.

Examples:

- Invoice
- Insurance
- License
- Maintenance Photo
- Driver Documents

⸻

Relationships

Vehicle

1:N

Shift

Shift

1:1

Driver Report

Vehicle

1:N

Expense

Expense

1:1

Maintenance Detail

Vehicle

1:N

Timeline Event

Shift

1:N

HGS Transit

Vehicle

1:N

Attachment

⸻

Index Strategy

Indexes should exist for:

vehicleId

driverId

shiftId

expenseDate

transitTime

status

category

createdAt

⸻

Constraints

Only one ACTIVE shift per vehicle.

Driver Report must belong to one Shift.

Maintenance Detail requires Maintenance Expense.

HGS records are immutable.

Timeline events are append-only.

Document revisions are immutable.

⸻

documents

Legal document metadata for vehicles and drivers.

Fields:

- ownerType (VEHICLE | DRIVER)
- ownerId
- title
- type
- issueDate
- expiryDate
- deletedAt (soft delete)

Status (VALID, EXPIRING, EXPIRED) is computed at runtime, not stored.

⸻

document_revisions

Immutable file metadata versions linked to a document.

Fields:

- documentId
- version
- fileName
- fileUrl
- mimeType
- size

⸻

Future Ready

The schema must support:

Multi Company

Multi Fleet

GPS

AI

OCR

Multiple Toll Providers

without structural redesign.
