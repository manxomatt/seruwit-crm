# Logistics and Fleet Specification

## Purpose
Manages fleet assets, driver assignments, regulatory document compliance, real-time Traccar GPS telemetry, multi-stop trip dispatching, Delivery Orders (DO) with Proof of Delivery (POD), driver performance scoring, and customer self-service shipment tracking.

## Requirements

### Requirement: Fleet Asset and Driver Management
The system SHALL track vehicles and drivers with operational status boards, vehicle specifications, fuel consumption logs, and maintenance histories.

#### Scenario: Vehicle status board update
- **GIVEN** a registered vehicle in the fleet
- **WHEN** assigned to an active trip
- **THEN** its status changes to `On Trip`, preventing duplicate assignments during the same operational time window.

---

### Requirement: Document Expiry Monitoring and Compliance
The system SHALL monitor vehicle and driver legal documents (STNK, KIR, driver SIM licenses) and execute scheduled daily scans to emit proactive expiry alerts.

#### Scenario: Scheduled compliance scan
- **GIVEN** a vehicle whose KIR inspection expires within 14 days
- **WHEN** the daily scheduler executes `document:scan-expiring`
- **THEN** the system generates in-app notifications and email alerts to fleet managers.

---

### Requirement: GPS Telemetry and Event-Driven Checkpoint Updates
The system SHALL connect to Traccar GPS servers, poll telemetry data, dispatch `VehiclePositionsRecorded` events, and update trip checkpoints upon geofence arrival.

#### Scenario: Automatic arrival at delivery destination
- **GIVEN** an active trip with a destination geofence
- **WHEN** incoming GPS coordinates place the assigned vehicle within the destination boundary
- **THEN** the listener marks the checkpoint status as `Arrived`, recording timestamps and odometer readings without automatically marking the delivery as completed.

---

### Requirement: Trip Dispatching and Multi-Stop Routing
The system SHALL support creating multi-stop delivery trips with defined sequence orders, estimated time windows, cargo capacity checks, and route optimization.

#### Scenario: Route optimization application
- **GIVEN** a planned trip with 5 customer delivery stops
- **WHEN** the route optimization tool calculates the optimal sequence for distance and time
- **THEN** stop orders and scheduled arrival windows are recalculated and applied to the trip itinerary.

---

### Requirement: Delivery Orders (DO) and Proof of Delivery (POD)
The system SHALL generate Delivery Orders from sales shipments or external logistics bookings, consolidate them into vehicle trips, render official PDF waybills (surat jalan), and capture electronic Proof of Delivery (POD).

#### Scenario: Electronic POD submission via driver portal
- **GIVEN** a driver arriving at the recipient location
- **WHEN** the driver captures the recipient's signature, recipient name, and delivery photo via the driver portal
- **THEN** the Delivery Order status transitions to `Delivered`, storing the POD proof and unlocking downstream billing charges.

#### Scenario: Public tracking access without authentication
- **GIVEN** an active Delivery Order with a unique tracking token
- **WHEN** a customer accesses `/track/{token}` in their browser
- **THEN** the public page displays the delivery status, current progress checkpoint, and live map view without requiring login credentials.

---

### Requirement: Driver Telemetry Scoring
The system SHALL compute driver behavioral safety scores based on speed violations, harsh braking, and route adherence derived from GPS telemetry feeds.

#### Scenario: Safety score recalculation
- **GIVEN** GPS positions recorded over a completed operational period
- **WHEN** telemetry events are processed by the scoring engine
- **THEN** penalty deductions are logged and the driver's composite score and leaderboard position are updated.
