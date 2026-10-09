# Finance and Billing Specification

## Purpose
Orchestrates commercial billing and financial controls: generic invoice lifecycle and PDF generation, accounts receivable (AR) allocation and aging, accounts payable (AP) supplier bills with 3-way matching, logistics route tariffs and driver cash advances, and General Ledger (GL) double-entry bookkeeping posted idempotently from operational events.

## Requirements

### Requirement: Generic Invoicing Lifecycle and PDF Rendering
The system SHALL support invoice creation with polymorphic line items referencing source business events (sales orders, logistics delivery charges, rental bookings), status transitions (`draft`, `issued`, `paid`, `void`), and professional PDF rendering.

#### Scenario: Issuing an invoice from delivery charges
- **GIVEN** completed delivery order charges in the Billing module
- **WHEN** an invoice is generated and issued to the partner
- **THEN** invoice lines are created pointing to the source charges, invoice status becomes `Issued`, and a dompdf download is generated.

#### Scenario: Voiding an issued invoice
- **GIVEN** an issued invoice with uncollected balances
- **WHEN** an authorized finance officer voids the invoice
- **THEN** the invoice status transitions to `Void`, source charges are released for re-billing, and reversal journal entries are posted if Accounting is active.

---

### Requirement: Accounts Receivable (AR) Allocation and Aging
The system SHALL track customer outstanding balances, record payment receipts, allocate funds across open invoices, and generate aging reports (current, 1-30, 31-60, 61-90, 90+ days).

#### Scenario: Partial payment allocation
- **GIVEN** an open invoice with a balance of $1,000
- **WHEN** a customer payment of $400 is recorded and allocated
- **THEN** the invoice remaining balance becomes $600, payment status is `Partially Paid`, and a customer receipt receipt is logged.

---

### Requirement: Accounts Payable (AP) and 3-Way Matching
The system SHALL generate supplier bills from confirmed Goods Receipt Notes (GRN), enforce 3-way matching between PO, GRN, and Bill, and manage payment disbursements.

#### Scenario: Supplier bill generation from GRN
- **GIVEN** a confirmed GRN with verified received quantities and agreed PO unit prices
- **WHEN** the supplier bill is generated
- **THEN** the bill records the payable amount against the supplier partner, preventing over-billing against the original PO.

---

### Requirement: Logistics Billing and Driver Cash Advances
The system SHALL compute freight charges from route tariffs based on origin/destination locations, and track driver trip cash advances (`uang jalan`) from disbursement through expense settlement.

#### Scenario: Driver cash advance settlement
- **GIVEN** an initial cash advance of $200 given to a driver for fuel and toll expenses
- **WHEN** the driver submits trip expense receipts totaling $180 upon trip completion
- **THEN** the system logs $180 in trip operating expenses and records a $20 cash return to company cash, closing the advance.

---

### Requirement: Double-Entry General Ledger Integration
The system SHALL maintain a Chart of Accounts (COA) and automatically project operational transactions into balanced journal entries via `AccountingPoster`, guaranteeing idempotency and auditability.

#### Scenario: Idempotent accounting post
- **GIVEN** a finalized operational document such as an issued invoice or inventory movement
- **WHEN** `AccountingPoster::post()` is invoked multiple times with the same source document and event key
- **THEN** the system generates exactly one set of balanced debit and credit journal lines, ignoring subsequent duplicate calls.

#### Scenario: Reversal on document void
- **GIVEN** an operational document that was previously posted to the ledger
- **WHEN** the document is voided or cancelled
- **THEN** the system creates a reversing journal entry with negated amounts or inverted debit/credit positions, keeping the audit trail intact without deleting historical rows.
