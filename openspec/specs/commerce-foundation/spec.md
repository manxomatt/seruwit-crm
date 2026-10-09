# Commerce Foundation Specification

## Purpose
Establishes the foundational commercial entities shared across trading, distribution, POS, and logistics operations: unified partner contacts (customers, vendors, suppliers), product catalog taxonomy with multiple units of measure (UOM), and inventory management across warehouses with stock ledger auditing.

## Requirements

### Requirement: Unified Partner Master
The system SHALL maintain a unified `partners` directory representing customers, vendors, and logistics partners, supporting multiple roles, contact persons, credit limits, and geographic locations (billing, shipping, and depot locations).

#### Scenario: Creating a partner with multiple roles
- **GIVEN** a business partner who acts as both a supplier of raw materials and a buyer of finished goods
- **WHEN** the partner record is saved with `is_customer = true` and `is_vendor = true`
- **THEN** the partner is available for selection in both Purchasing and Sales workflows with a single unified account history.

#### Scenario: Location association for logistics matching
- **GIVEN** a customer partner with multiple branch addresses
- **WHEN** locations are registered under the partner with coordinate geocodes
- **THEN** downstream Delivery Orders and Billing modules match route tariffs based on the location entity.

---

### Requirement: Product Catalog and Taxonomy
The system SHALL provide SKU management, branding, taxonomy (principal, brand, product category, tags), and Unit of Measure (UOM) conversions for stock keeping and commercial transactions.

#### Scenario: Multi-UOM stock representation
- **GIVEN** a product with base unit `PCS`, packaging unit `BOX` containing 24 PCS, and `CARTON` containing 10 BOXes
- **WHEN** a sales transaction is executed in `BOX`
- **THEN** the system tracks the quantity in both transaction UOM and base inventory UOM accurately.

---

### Requirement: Multi-Warehouse Inventory Management
The system SHALL track item quantities across multiple warehouses and specific bin locations, maintaining an immutable stock ledger for every inventory movement.

#### Scenario: Internal stock transfer between warehouses
- **GIVEN** stock existing at `Warehouse A`
- **WHEN** a stock transfer to `Warehouse B` is submitted and confirmed
- **THEN** the system debits stock ledger at `Warehouse A` and credits `Warehouse B`, logging the transaction reference and moving average cost.

---

### Requirement: Batch and Expiry Date Tracking
The system SHALL support tracking batch/lot numbers and expiration dates for perishable and regulated goods during receipt, storage, and fulfillment.

#### Scenario: Outbound batch picking
- **GIVEN** inventory available in multiple batches with different expiration dates
- **WHEN** an order fulfillment process allocates stock
- **THEN** the system enforces First-Expired-First-Out (FEFO) or First-In-First-Out (FIFO) stock allocation rules.

---

### Requirement: Stock Reservation and Physical Opname
The system SHALL support stock reservations for confirmed orders to prevent overselling, and periodic stock opname (physical count adjustments) with variance reporting.

#### Scenario: Stock reservation upon confirmed sale
- **GIVEN** available stock of 100 units
- **WHEN** a sales order for 30 units is approved
- **THEN** the system marks 30 units as reserved, reducing available-to-promise quantity to 70 while total physical stock remains 100 until shipment.

#### Scenario: Stock opname adjustment posting
- **GIVEN** a recorded ledger balance of 50 units but a physical count of 48 units
- **WHEN** the opname adjustment is approved
- **THEN** the system logs a negative stock adjustment of 2 units with an audit reason and updates GL inventory shrink if Accounting is enabled.
