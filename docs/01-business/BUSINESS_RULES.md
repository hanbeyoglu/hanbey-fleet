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

Settlement Rules

BR-050

Settlement can only be created from an APPROVED Driver Report.

⸻

BR-051

Only one Settlement may exist per Shift.

⸻

BR-052

Actual HGS equals SUM(HgsTransit.amount) for the shift.

⸻

BR-053

Expenses equals SUM(Expense.amount) for the shift.

⸻

BR-054

Difference equals declaredHgs minus actualHgs.

⸻

BR-055

Settlement status is MATCHED when difference equals zero, otherwise MISMATCH.

⸻

BR-056

Net revenue equals declaredRevenue minus actualHgs minus expenses.

⸻

BR-057

Settlement may later be approved. Approval stores approvedById and approvedAt.

⸻

BR-058

Timeline events SETTLEMENT_CREATED and SETTLEMENT_APPROVED are generated automatically.

⸻

Timeline Rules

BR-059

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
- Settlement Created
- Settlement Approved

⸻

Dashboard Rules

BR-060

Dashboard represents today's operational status.

⸻

BR-061

Today's revenue equals SUM(Settlement.netRevenue) for settlements created today.

⸻

BR-062

Today's expenses equals SUM(Expense.amount) for expenses dated today.

⸻

BR-063

Today's HGS equals SUM(HgsTransit.amount) for transits occurring today.

⸻

BR-064

Active vehicles are vehicles with status ACTIVE_SHIFT.

⸻

BR-065

Active drivers are drivers with an ACTIVE shift.

⸻

BR-066

Today's completed shifts are shifts with status COMPLETED and actualEnd today.

⸻

BR-067

Maintenance count is the number of maintenance records dated today.

⸻

BR-068

Settlement summary exposes counts for MATCHED, MISMATCH and APPROVED statuses.

⸻

BR-069

Dashboard exposes the last 20 timeline events.

⸻

BR-070

Dashboard metrics must be calculated from existing aggregates. No duplicated financial tables.

⸻

Notification Rules

BR-080

Notifications are created automatically by the system. Controllers must never manually insert notifications.

⸻

BR-081

Maintenance reminder: when `nextMaintenanceMileage <= vehicle.currentMileage`, a maintenance reminder notification is created.

⸻

BR-082

Warranty reminder: when `warrantyUntil` expires within 30 days, a warranty reminder notification is created.

⸻

BR-083

Settlement mismatch: when `Settlement.status == MISMATCH`, a settlement mismatch notification is created.

⸻

BR-084

Driver report missing: when a completed shift has no driver report after a configurable threshold (default 24 hours), a missing driver report notification is created.

⸻

BR-085

Unread notifications are returned first in list queries.

⸻

BR-086

Notifications may be marked as read by the recipient user.

⸻

BR-087

Notifications are never hard deleted. Use soft delete via `deletedAt`.

⸻

BR-088

Timeline and Notification are independent concepts. Timeline records history; notifications require user action. Do not merge them.

⸻

Import Rules

BR-090

Every import creates an ImportJob record.

⸻

BR-091

Supported import sources: MANUAL, WHATSAPP, OCR.

⸻

BR-092

Raw imported message must always be stored. Never discard original text.

⸻

BR-093

Parsing must be isolated in ParserService. Never parse inside Controller.

⸻

BR-094

If required fields cannot be extracted, ImportJob status becomes FAILED.

⸻

BR-095

If a DriverReport already exists for the Shift, do not create another. Return Conflict.

⸻

BR-096

Successful import automatically creates a DriverReport and generates timeline event DRIVER_REPORT_IMPORTED.

⸻

BR-097

Import history must be queryable with pagination and filters.

⸻

Scheduler Rules

BR-100

ReminderService.runAllChecks() must execute automatically every hour.

⸻

BR-101

Maintenance reminder checks run every day at 08:00.

⸻

BR-102

Warranty reminder checks run every day at 09:00.

⸻

BR-103

Missing driver report checks run every hour.

⸻

BR-104

Settlement mismatch notifications run every 30 minutes.

⸻

BR-105

HGS synchronization runs every night at 02:00. No external API is called; the scheduler invokes the existing HgsService.sync() stub.

⸻

BR-106

Completed ImportJobs older than 90 days are archived via soft delete.

⸻

BR-107

Failed ImportJobs remain forever and are never archived.

⸻

BR-108

Scheduler failures must never stop other jobs. Each job runs in isolated try/catch.

⸻

BR-109

Execution logs are written through Logger only. No database log table.

⸻

Document Rules

BR-110

Every document belongs to exactly one owner. OwnerType is VEHICLE or DRIVER.

⸻

BR-111

Every document has title, type, issueDate, expiryDate, file metadata and computed status.

⸻

BR-112

Document status (VALID, EXPIRING, EXPIRED) is computed automatically from expiryDate. Never stored in the database.

⸻

BR-113

When a document expires within 30 days, a DOCUMENT_EXPIRING notification is generated for fleet managers.

⸻

BR-114

Expired documents appear on the Dashboard compliance section.

⸻

BR-115

Documents use soft delete only via deletedAt.

⸻

BR-116

Document files are metadata only (fileName, fileUrl, mimeType, size). No real file storage.

⸻

BR-117

Uploading a newer version creates a new immutable DocumentRevision. Previous revisions remain unchanged.

⸻

BR-118

Document lifecycle generates timeline events: DOCUMENT_UPLOADED, DOCUMENT_REPLACED, DOCUMENT_DELETED.

⸻

Vehicle Assignment Rules

BR-120

A vehicle can have only one active assignment at any given time.

⸻

BR-121

A driver can have only one active assignment at any given time.

⸻

BR-122

Assignment creation does NOT start a Shift.

Shift and Assignment are independent concepts.

⸻

BR-123

Assignment release does NOT finish a Shift.

⸻

BR-124

Assignment history is immutable.

Assignments are never deleted or soft-deleted.

They can only be released (releasedAt is set).

⸻

BR-125

Assigning a vehicle that already has an active assignment returns Conflict (409).

Assigning to a driver that already has an active assignment returns Conflict (409).

⸻

BR-126

Vehicle assignment automatically generates the VEHICLE_ASSIGNED timeline event.

⸻

BR-127

Vehicle release automatically generates the VEHICLE_RELEASED timeline event.

⸻

BR-128

Dashboard must expose:

- Assigned Vehicles: count of vehicles with an active assignment
- Unassigned Vehicles: count of vehicles without an active assignment
- Assigned Drivers: count of drivers with an active assignment
- Available Drivers: count of drivers without an active assignment

⸻

Fleet Isolation Rules

BR-160

Every fleet-scoped aggregate must be filtered by fleetOwnerId.

⸻

BR-161

OWNER cannot see another FleetOwner's vehicles.

⸻

BR-162

OWNER cannot see another FleetOwner's drivers.

⸻

BR-163

OWNER cannot see another FleetOwner's assignments.

⸻

BR-164

OWNER cannot see another FleetOwner's shifts, reports, expenses, HGS, maintenance, documents, settlements, timeline or dashboard data.

⸻

BR-165

SUPER_ADMIN can access all fleet data and may optionally filter by fleetOwnerId.

⸻

BR-166

If a non-SUPER_ADMIN request has no fleetOwnerId in JWT, reject with 403.

⸻

BR-167

Driver Portal must require selected fleet context if driver belongs to multiple fleets.

⸻

BR-168

Cross-fleet access must return 403 or 404; never leak data existence.

⸻

Future Rules

Additional business rules may be introduced without changing existing rules.

Business rules are considered the single source of truth for application behavior.
