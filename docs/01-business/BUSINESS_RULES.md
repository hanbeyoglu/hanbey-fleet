Business Rules

Status: Draft
Version: 1.0.0

⸻

Purpose

This document defines the business rules of Hanbey Fleet.

Business rules describe how the business operates, independent of technology or implementation.

⸻

Vehicle Rules

BR-001

A vehicle can only have one ACTIVE shift at any given time.

⸻

BR-002

A vehicle cannot be assigned to another driver until the current shift is completed.

⸻

BR-003

Every vehicle must have exactly one current state.

Possible states:

- Idle
- Active Shift
- Maintenance
- Out of Service

⸻

Shift Rules

BR-010

Every shift belongs to exactly one vehicle.

⸻

BR-011

Every shift belongs to exactly one driver.

⸻

BR-012

A shift has four timestamps.

- Planned Start
- Actual Start
- Planned End
- Actual End

⸻

BR-013

Standard shifts are:

Day Shift

03:00 → 15:00

Night Shift

15:00 → 03:00

Actual times may vary.

⸻

BR-014

Only one ACTIVE shift may exist per vehicle.

⸻

Driver Report Rules

BR-020

Drivers submit a report after completing a shift.

⸻

BR-021

A Driver Report contains:

- Daily Revenue
- Declared HGS
- Notes

⸻

BR-022

Driver Reports cannot be modified after approval.

⸻

HGS Rules

BR-030

HGS data is read-only.

⸻

BR-031

HGS records are created only by synchronization with the bank API.

⸻

BR-032

Manual creation, modification or deletion of HGS records is prohibited.

⸻

BR-033

Each HGS transit is automatically matched to the active shift based on the transit timestamp.

⸻

Expense Rules

BR-040

Every expense belongs to exactly one vehicle.

⸻

BR-041

Expense categories:

- Fuel
- Maintenance
- Insurance
- Tax
- Penalty
- Parking
- Cleaning
- Other

⸻

BR-042

Maintenance expenses create both:

- Expense
- Maintenance Record

⸻

Timeline Rules

BR-050

Timeline events are generated automatically.

Manual timeline creation is not allowed.

⸻

Timeline events include:

- Shift Started
- Shift Ended
- Expense Added
- HGS Imported
- Maintenance Completed
- Driver Report Submitted

⸻

Dashboard Rules

BR-060

The dashboard always displays the current operational state.

It must answer:

- Who currently has the vehicle?
- Is there an active shift?
- Today’s HGS
- Today’s revenue
- Current alerts

⸻

Future Rules

Additional business rules may be introduced without changing existing rules.

Business rules are considered the single source of truth for application behavior.
