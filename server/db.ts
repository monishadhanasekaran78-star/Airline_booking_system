import bcrypt from 'bcryptjs';
import { PriceContext } from './pricing';

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  phone: string;
  role: 'passenger' | 'admin';
  created_at: string;
}

export interface Aircraft {
  id: number;
  model: string;
  registration_number: string;
  total_seats: number;
  created_at: string;
}

export interface Flight {
  id: number;
  flight_number: string;
  aircraft_id: number;
  origin_city: string;
  origin_code: string;
  destination_city: string;
  destination_code: string;
  departure_time: string;
  arrival_time: string;
  base_fare_inr: number;
  status: 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'CANCELLED';
  created_at: string;
}

export interface Seat {
  id: number;
  flight_id: number;
  seat_number: string; // e.g. 1A..4F
  seat_class: 'ECONOMY' | 'PREMIUM';
  price_inr: number;
  status: 'AVAILABLE' | 'LOCKED' | 'BOOKED';
  locked_by: number | null;
  locked_until: string | null;
  created_at: string;
}

export interface Booking {
  id: number;
  pnr: string;
  user_id: number;
  flight_id: number;
  passenger_name: string;
  passenger_age: number;
  passenger_gender: 'Male' | 'Female' | 'Other';
  passenger_phone: string;
  seat_id: number;
  seat_number: string;
  total_amount_inr: number;
  booking_status: 'CONFIRMED' | 'CANCELLED';
  created_at: string;
}

export interface Payment {
  id: number;
  booking_id: number;
  transaction_id: string;
  amount_inr: number;
  payment_method: string;
  payment_status: 'SUCCESS' | 'FAILED';
  payment_time: string;
}

export interface Refund {
  id: number;
  booking_id: number;
  original_amount_inr: number;
  refund_percentage: number;
  refund_amount_inr: number;
  refund_status: 'PROCESSED' | 'FAILED';
  processed_at: string;
}

class SkyBookDatabase {
  public users: User[] = [];
  public aircraft: Aircraft[] = [];
  public flights: Flight[] = [];
  public seats: Seat[] = [];
  public bookings: Booking[] = [];
  public payments: Payment[] = [];
  public refunds: Refund[] = [];

  private nextUserId = 1;
  private nextAircraftId = 1;
  private nextFlightId = 1;
  private nextSeatId = 1;
  private nextBookingId = 1;
  private nextPaymentId = 1;
  private nextRefundId = 1;

  // Row lock mutex for ACID concurrency simulation
  private seatLocks = new Map<number, boolean>();

  constructor() {
    this.seedDatabase();
  }

  private seedDatabase() {
    const saltRounds = 10;
    const adminPasswordHash = bcrypt.hashSync('admin123', saltRounds);
    const passengerPasswordHash = bcrypt.hashSync('passenger123', saltRounds);

    // 1. Users
    this.users.push(
      {
        id: this.nextUserId++,
        name: 'Admin SkyBook',
        email: 'admin@air.com',
        password_hash: adminPasswordHash,
        phone: '+91 98765 00000',
        role: 'admin',
        created_at: new Date('2026-10-01T00:00:00Z').toISOString(),
      },
      {
        id: this.nextUserId++,
        name: 'Rahul Sharma',
        email: 'rahul@example.in',
        password_hash: passengerPasswordHash,
        phone: '+91 98401 23456',
        role: 'passenger',
        created_at: new Date('2026-10-01T00:00:00Z').toISOString(),
      }
    );

    // 2. Aircraft
    this.aircraft.push(
      {
        id: this.nextAircraftId++,
        model: 'Airbus A320neo',
        registration_number: 'VT-SKB',
        total_seats: 24,
        created_at: new Date('2026-10-01T00:00:00Z').toISOString(),
      },
      {
        id: this.nextAircraftId++,
        model: 'Boeing 737 MAX 8',
        registration_number: 'VT-SKA',
        total_seats: 24,
        created_at: new Date('2026-10-01T00:00:00Z').toISOString(),
      },
      {
        id: this.nextAircraftId++,
        model: 'Airbus A321neo',
        registration_number: 'VT-SKC',
        total_seats: 24,
        created_at: new Date('2026-10-01T00:00:00Z').toISOString(),
      }
    );

    // 3. Indian Domestic Flights
    const flightSeeds = [
      {
        flight_number: 'SK-101',
        aircraft_id: 1,
        origin_city: 'Chennai',
        origin_code: 'MAA',
        destination_city: 'Delhi',
        destination_code: 'DEL',
        departure_time: '2026-10-05T06:30:00+05:30',
        arrival_time: '2026-10-05T09:15:00+05:30',
        base_fare_inr: 4800,
        status: 'SCHEDULED' as const,
      },
      {
        flight_number: 'SK-102',
        aircraft_id: 1,
        origin_city: 'Delhi',
        origin_code: 'DEL',
        destination_city: 'Mumbai',
        destination_code: 'BOM',
        departure_time: '2026-10-05T10:45:00+05:30',
        arrival_time: '2026-10-05T13:00:00+05:30',
        base_fare_inr: 4200,
        status: 'SCHEDULED' as const,
      },
      {
        flight_number: 'SK-201',
        aircraft_id: 2,
        origin_city: 'Mumbai',
        origin_code: 'BOM',
        destination_city: 'Bengaluru',
        destination_code: 'BLR',
        departure_time: '2026-10-05T14:30:00+05:30',
        arrival_time: '2026-10-05T16:15:00+05:30',
        base_fare_inr: 3600,
        status: 'SCHEDULED' as const,
      },
      {
        flight_number: 'SK-202',
        aircraft_id: 2,
        origin_city: 'Bengaluru',
        origin_code: 'BLR',
        destination_city: 'Chennai',
        destination_code: 'MAA',
        departure_time: '2026-10-05T17:45:00+05:30',
        arrival_time: '2026-10-05T18:40:00+05:30',
        base_fare_inr: 2500,
        status: 'SCHEDULED' as const,
      },
      {
        flight_number: 'SK-301',
        aircraft_id: 3,
        origin_city: 'Hyderabad',
        origin_code: 'HYD',
        destination_city: 'Delhi',
        destination_code: 'DEL',
        departure_time: '2026-10-06T07:15:00+05:30',
        arrival_time: '2026-10-06T09:40:00+05:30',
        base_fare_inr: 5200,
        status: 'SCHEDULED' as const,
      },
      {
        flight_number: 'SK-302',
        aircraft_id: 3,
        origin_city: 'Kolkata',
        origin_code: 'CCU',
        destination_city: 'Bengaluru',
        destination_code: 'BLR',
        departure_time: '2026-10-06T11:30:00+05:30',
        arrival_time: '2026-10-06T14:10:00+05:30',
        base_fare_inr: 6400,
        status: 'SCHEDULED' as const,
      },
      {
        flight_number: 'SK-401',
        aircraft_id: 1,
        origin_city: 'Coimbatore',
        origin_code: 'CJB',
        destination_city: 'Chennai',
        destination_code: 'MAA',
        departure_time: '2026-10-07T08:00:00+05:30',
        arrival_time: '2026-10-07T09:05:00+05:30',
        base_fare_inr: 2800,
        status: 'SCHEDULED' as const,
      },
      {
        flight_number: 'SK-402',
        aircraft_id: 2,
        origin_city: 'Kochi',
        origin_code: 'COK',
        destination_city: 'Bengaluru',
        destination_code: 'BLR',
        departure_time: '2026-10-07T12:20:00+05:30',
        arrival_time: '2026-10-07T13:25:00+05:30',
        base_fare_inr: 3100,
        status: 'SCHEDULED' as const,
      }
    ];

    for (const f of flightSeeds) {
      const flight: Flight = {
        id: this.nextFlightId++,
        ...f,
        created_at: new Date().toISOString(),
      };
      this.flights.push(flight);

      // Generate 24 seats: Rows 1-4, Cols A-F
      // Row 1: PREMIUM (+₹800), Rows 2-4: ECONOMY
      const cols = ['A', 'B', 'C', 'D', 'E', 'F'];
      for (let r = 1; r <= 4; r++) {
        for (const col of cols) {
          const seatNum = `${r}${col}`;
          const isPremium = r === 1;
          const seatClass = isPremium ? 'PREMIUM' : 'ECONOMY';
          const price = isPremium ? flight.base_fare_inr + 800 : flight.base_fare_inr;

          this.seats.push({
            id: this.nextSeatId++,
            flight_id: flight.id,
            seat_number: seatNum,
            seat_class: seatClass,
            price_inr: price,
            status: 'AVAILABLE',
            locked_by: null,
            locked_until: null,
            created_at: new Date().toISOString(),
          });
        }
      }
    }

    // Seed one sample confirmed booking for Rahul Sharma (Seat 2A on Flight 1)
    const seedSeat = this.seats.find(s => s.flight_id === 1 && s.seat_number === '2A');
    if (seedSeat) {
      seedSeat.status = 'BOOKED';
      const bookingId = this.nextBookingId++;
      this.bookings.push({
        id: bookingId,
        pnr: 'SKB9X2M4',
        user_id: 2,
        flight_id: 1,
        passenger_name: 'Rahul Sharma',
        passenger_age: 28,
        passenger_gender: 'Male',
        passenger_phone: '+91 98401 23456',
        seat_id: seedSeat.id,
        seat_number: seedSeat.seat_number,
        total_amount_inr: seedSeat.price_inr,
        booking_status: 'CONFIRMED',
        created_at: new Date('2026-10-02T10:30:00Z').toISOString(),
      });

      this.payments.push({
        id: this.nextPaymentId++,
        booking_id: bookingId,
        transaction_id: 'TXN-98401234-SKB',
        amount_inr: seedSeat.price_inr,
        payment_method: 'UPI (BHIM / GPay)',
        payment_status: 'SUCCESS',
        payment_time: new Date('2026-10-02T10:30:15Z').toISOString(),
      });
    }
  }

  /**
   * Cleans up expired seat locks (held > 5 minutes).
   * Automatically executes row cleanup before any seat status query.
   */
  public cleanupExpiredLocks(): void {
    const now = new Date();
    for (const seat of this.seats) {
      if (seat.status === 'LOCKED' && seat.locked_until) {
        if (new Date(seat.locked_until) <= now) {
          seat.status = 'AVAILABLE';
          seat.locked_by = null;
          seat.locked_until = null;
        }
      }
    }
  }

  /**
   * CONCURRENCY & TRANSACTION:
   * Acquires a row lock and locks a seat for 5 minutes for user.
   * If another user holds the seat or it is booked, throws "Seat already taken".
   */
  public async lockSeat(flightId: number, seatNumber: string, userId: number): Promise<Seat> {
    this.cleanupExpiredLocks();

    const seat = this.seats.find(s => s.flight_id === flightId && s.seat_number === seatNumber);
    if (!seat) {
      throw new Error('Seat not found');
    }

    // Mutex to simulate SELECT ... FOR UPDATE
    if (this.seatLocks.get(seat.id)) {
      throw new Error('Seat already taken. A concurrent transaction is processing this seat.');
    }

    this.seatLocks.set(seat.id, true);

    try {
      if (seat.status === 'BOOKED') {
        throw new Error('Seat already taken');
      }

      if (seat.status === 'LOCKED') {
        const now = new Date();
        const lockExpiry = seat.locked_until ? new Date(seat.locked_until) : null;
        if (lockExpiry && lockExpiry > now && seat.locked_by !== userId) {
          throw new Error('Seat already taken');
        }
      }

      // Lock seat for 5 minutes (300,000 ms)
      const lockDurationMs = 5 * 60 * 1000;
      const lockedUntil = new Date(Date.now() + lockDurationMs).toISOString();

      seat.status = 'LOCKED';
      seat.locked_by = userId;
      seat.locked_until = lockedUntil;

      return seat;
    } finally {
      this.seatLocks.delete(seat.id);
    }
  }

  /**
   * Releases an existing lock (e.g. if payment fails or user cancels selection)
   */
  public unlockSeat(flightId: number, seatNumber: string, userId: number): void {
    const seat = this.seats.find(s => s.flight_id === flightId && s.seat_number === seatNumber);
    if (seat && seat.status === 'LOCKED' && seat.locked_by === userId) {
      seat.status = 'AVAILABLE';
      seat.locked_by = null;
      seat.locked_until = null;
    }
  }

  /**
   * Completes a booking with payment.
   * Validates row lock, updates seat to BOOKED, creates booking record with PNR.
   */
  public async confirmBooking(params: {
    userId: number;
    flightId: number;
    seatNumber: string;
    passengerName: string;
    passengerAge: number;
    passengerGender: 'Male' | 'Female' | 'Other';
    passengerPhone: string;
    paymentMethod: string;
  }): Promise<{ booking: Booking; payment: Payment }> {
    this.cleanupExpiredLocks();

    const seat = this.seats.find(s => s.flight_id === params.flightId && s.seat_number === params.seatNumber);
    if (!seat) {
      throw new Error('Seat not found');
    }

    if (this.seatLocks.get(seat.id)) {
      throw new Error('Transaction contention: please try again');
    }

    this.seatLocks.set(seat.id, true);

    try {
      if (seat.status === 'BOOKED') {
        throw new Error('Seat already taken');
      }

      // Verify that the user currently holds the valid lock
      const now = new Date();
      const lockExpiry = seat.locked_until ? new Date(seat.locked_until) : null;
      if (!lockExpiry || lockExpiry <= now || seat.locked_by !== params.userId) {
        throw new Error('Seat lock expired. Seat is no longer held.');
      }

      // Mark seat as BOOKED
      seat.status = 'BOOKED';
      seat.locked_by = null;
      seat.locked_until = null;

      // Generate unique PNR (e.g., SKB7M9Q)
      const pnr = 'SKB' + Math.random().toString(36).substring(2, 7).toUpperCase();

      const bookingId = this.nextBookingId++;
      const booking: Booking = {
        id: bookingId,
        pnr,
        user_id: params.userId,
        flight_id: params.flightId,
        passenger_name: params.passengerName,
        passenger_age: params.passengerAge,
        passenger_gender: params.passengerGender,
        passenger_phone: params.passengerPhone,
        seat_id: seat.id,
        seat_number: seat.seat_number,
        total_amount_inr: seat.price_inr,
        booking_status: 'CONFIRMED',
        created_at: new Date().toISOString(),
      };
      this.bookings.push(booking);

      const paymentId = this.nextPaymentId++;
      const txnId = 'TXN-' + Math.floor(10000000 + Math.random() * 90000000) + '-SKB';
      const payment: Payment = {
        id: paymentId,
        booking_id: bookingId,
        transaction_id: txnId,
        amount_inr: seat.price_inr,
        payment_method: params.paymentMethod || 'UPI (BHIM / GPay)',
        payment_status: 'SUCCESS',
        payment_time: new Date().toISOString(),
      };
      this.payments.push(payment);

      return { booking, payment };
    } finally {
      this.seatLocks.delete(seat.id);
    }
  }

  /**
   * Handles payment failure: unlocks the held seat immediately.
   */
  public handleFailedPayment(flightId: number, seatNumber: string, userId: number): void {
    this.unlockSeat(flightId, seatNumber, userId);
  }

  /**
   * Cancels a booking, issues automatic 80% refund in INR, and restores seat.
   */
  public cancelBooking(bookingId: number, userId: number, isAdmin = false): { booking: Booking; refund: Refund } {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (!isAdmin && booking.user_id !== userId) {
      throw new Error('Unauthorized');
    }

    if (booking.booking_status === 'CANCELLED') {
      throw new Error('Booking is already cancelled');
    }

    booking.booking_status = 'CANCELLED';

    // Free the seat
    const seat = this.seats.find(s => s.id === booking.seat_id);
    if (seat) {
      seat.status = 'AVAILABLE';
      seat.locked_by = null;
      seat.locked_until = null;
    }

    // 80% automatic refund calculation in Indian Rupees (₹)
    const refundPercentage = 80;
    const refundAmountInr = Math.round((booking.total_amount_inr * refundPercentage) / 100);

    const refundId = this.nextRefundId++;
    const refund: Refund = {
      id: refundId,
      booking_id: booking.id,
      original_amount_inr: booking.total_amount_inr,
      refund_percentage: refundPercentage,
      refund_amount_inr: refundAmountInr,
      refund_status: 'PROCESSED',
      processed_at: new Date().toISOString(),
    };
    this.refunds.push(refund);

    return { booking, refund };
  }

  /**
   * Helper to recalculate dynamic prices for all seats on a flight
   * using the Strategy Design Pattern.
   */
  public getFlightWithDynamicFare(flight: Flight): Flight & { dynamic_fare_inr: number; strategy_applied: string } {
    this.cleanupExpiredLocks();
    const flightSeats = this.seats.filter(s => s.flight_id === flight.id);
    const bookedCount = flightSeats.filter(s => s.status === 'BOOKED').length;

    const pricingData = {
      id: flight.id,
      baseFareInr: flight.base_fare_inr,
      departureTime: flight.departure_time,
      totalSeats: flightSeats.length || 24,
      bookedSeatsCount: bookedCount,
    };

    const strategy = PriceContext.resolveStrategy(pricingData);
    const context = new PriceContext(strategy);
    const dynamicFare = context.executeStrategy(pricingData);

    return {
      ...flight,
      dynamic_fare_inr: dynamicFare,
      strategy_applied: strategy.strategyName,
    };
  }

  /**
   * Admin: Add new flight with aircraft and 24 seats
   */
  public createFlight(data: {
    flight_number: string;
    aircraft_id: number;
    origin_city: string;
    origin_code: string;
    destination_city: string;
    destination_code: string;
    departure_time: string;
    arrival_time: string;
    base_fare_inr: number;
  }): Flight {
    // Check flight number uniqueness
    if (this.flights.some(f => f.flight_number.toUpperCase() === data.flight_number.toUpperCase())) {
      throw new Error(`Flight number ${data.flight_number} already exists`);
    }

    const flight: Flight = {
      id: this.nextFlightId++,
      flight_number: data.flight_number.toUpperCase(),
      aircraft_id: Number(data.aircraft_id),
      origin_city: data.origin_city,
      origin_code: data.origin_code.toUpperCase(),
      destination_city: data.destination_city,
      destination_code: data.destination_code.toUpperCase(),
      departure_time: data.departure_time,
      arrival_time: data.arrival_time,
      base_fare_inr: Number(data.base_fare_inr),
      status: 'SCHEDULED',
      created_at: new Date().toISOString(),
    };
    this.flights.push(flight);

    // Generate 24 seats: Rows 1-4, Cols A-F
    const cols = ['A', 'B', 'C', 'D', 'E', 'F'];
    for (let r = 1; r <= 4; r++) {
      for (const col of cols) {
        const seatNum = `${r}${col}`;
        const isPremium = r === 1;
        const seatClass = isPremium ? 'PREMIUM' : 'ECONOMY';
        const price = isPremium ? flight.base_fare_inr + 800 : flight.base_fare_inr;

        this.seats.push({
          id: this.nextSeatId++,
          flight_id: flight.id,
          seat_number: seatNum,
          seat_class: seatClass,
          price_inr: price,
          status: 'AVAILABLE',
          locked_by: null,
          locked_until: null,
          created_at: new Date().toISOString(),
        });
      }
    }

    return flight;
  }

  /**
   * Admin: Delete flight and its associated seats/bookings
   */
  public deleteFlight(flightId: number): void {
    const flightIdx = this.flights.findIndex(f => f.id === flightId);
    if (flightIdx === -1) {
      throw new Error('Flight not found');
    }
    this.flights.splice(flightIdx, 1);
    this.seats = this.seats.filter(s => s.flight_id !== flightId);
  }

  /**
   * Admin: Update flight
   */
  public updateFlight(flightId: number, data: Partial<Flight>): Flight {
    const flight = this.flights.find(f => f.id === flightId);
    if (!flight) {
      throw new Error('Flight not found');
    }
    Object.assign(flight, data);
    return flight;
  }
}

export const db = new SkyBookDatabase();
