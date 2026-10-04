# SkyBook - Airline Booking System
**Capstone Project: Object Oriented Software Engineering (BE23CS411)**

SkyBook is a full-stack Indian domestic airline reservation application built with a React frontend, Node.js + Express REST API backend, and a relational MySQL database architecture with transactional row-level locking.

---

## Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express, TypeScript, JWT Authentication, Bcrypt password hashing
- **Database**: MySQL (`schema.sql` included with complete DDL & seed data)
- **Design Pattern**: Strategy Pattern (`pricing.js` / `pricing.ts`) for dynamic yield pricing

---

## Local Setup & Run Instructions

### 1. Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- MySQL Server (v8.0 or higher)

### 2. Clone and Install Dependencies
```bash
git clone <repository_url>
cd skybook
npm install
```

### 3. Setup MySQL Database
Open your terminal and load the schema and seed data into MySQL:
```bash
mysql -u root -p < schema.sql
```
*This creates the `skybook_db` database, tables (`users`, `aircraft`, `flights`, `seats`, `bookings`, `payments`, `refunds`), and seeds 6 domestic flights with 24 seats each.*

### 4. Configure Environment (Optional)
If running against a local MySQL instance, configure `.env`:
```env
PORT=3000
JWT_SECRET=skybook_capstone_jwt_secret_key_2026
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=skybook_db
```
*(SkyBook also contains a built-in memory transactional database engine that runs out-of-the-box in development mode without external setup).*

### 5. Start the Application
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3000
```

---

## Demo Accounts
| Role | Email | Password | Access |
|---|---|---|---|
| **Administrator** | `admin@air.com` | `admin123` | Flight schedules, aircraft fleet, all bookings |
| **Passenger** | `rahul@example.in` | `passenger123` | Search, seat lock, checkout, My Bookings |

---

## Currency & Localization Details
- **Currency**: All fares, totals, and refunds are calculated and displayed in Indian Rupees (₹) using `Intl.NumberFormat('en-IN')`.
- **Timezone**: Dates in Indian standard format (`05 Oct 2026`) and times in 12-hour IST format (`06:30 AM`).
- **Indian Domestic Routes**: Chennai (MAA), Delhi (DEL), Mumbai (BOM), Bengaluru (BLR), Hyderabad (HYD), Kolkata (CCU), Coimbatore (CJB), Kochi (COK).
- **Realistic Fares**: ₹2,500 to ₹9,000 per seat.

---

## Object Oriented Design Pattern (Viva Q&A)

### Strategy Design Pattern (`pricing.js`)
SkyBook implements the **Strategy Behavioral Pattern** for dynamic pricing:
1. **`PricingStrategy` Interface**: Defines `calculate(flight)`.
2. **`StandardPricing`**: Computes regular advance fare.
3. **`DemandPricing`**: Dynamically increases fare based on seat occupancy (+15% at 50% capacity, +30% at 75% capacity).
4. **`LastMinutePricing`**: Applies a 25% surge when flight departure is within 72 hours (3 days).
5. **`PriceContext`**: Context class that selects and delegates to the concrete strategy at runtime.

*Adheres to the Open/Closed Principle (OCP): New pricing schemes (e.g., FestivalSurgePricing) can be introduced without modifying existing flight scheduling code.*

---

## Concurrency & 5-Minute Seat Locking
1. **Row-Level Locking**: When a seat is chosen, a database transaction checks availability (`SELECT ... FOR UPDATE`).
2. **Exclusivity**: If a concurrent user attempts to lock the same seat, they are rejected with `"Seat already taken"`.
3. **Holding Window**: A seat is held for 5 minutes (`locked_until`).
4. **Rollback**: Clicking **"Simulate Failed Payment"** or letting the 5-minute timer expire immediately returns the seat to `AVAILABLE`.
5. **Commit**: Clicking **"Pay Now"** sets status to `BOOKED` and issues a unique PNR (e.g., `SKB9X2M4`).

---

## Automatic 80% Refund on Cancellation
Passengers can cancel confirmed bookings from **My Bookings**. The system automatically credits an **80% refund in ₹** and makes the seat available for rebooking.
