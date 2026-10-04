import { Router } from 'express';
import { db } from '../db';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

export const bookingRouter = Router();

// POST /api/bookings - Confirm booking with simulated payment
bookingRouter.post('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      flightId,
      seatNumber,
      passengerName,
      passengerAge,
      passengerGender,
      passengerPhone,
      paymentMethod,
    } = req.body;

    if (!flightId || !seatNumber || !passengerName || !passengerAge || !passengerGender || !passengerPhone) {
      res.status(400).json({ error: 'Please fill in all passenger and booking details.' });
      return;
    }

    const userId = req.user!.id;

    try {
      const result = await db.confirmBooking({
        userId,
        flightId: Number(flightId),
        seatNumber: String(seatNumber).toUpperCase(),
        passengerName: passengerName.trim(),
        passengerAge: Number(passengerAge),
        passengerGender,
        passengerPhone: passengerPhone.trim(),
        paymentMethod: paymentMethod || 'UPI / NetBanking',
      });

      const flight = db.flights.find(f => f.id === Number(flightId));

      res.status(201).json({
        message: 'Booking confirmed successfully.',
        booking: result.booking,
        payment: result.payment,
        flight,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Booking failed';
      res.status(409).json({ error: message });
    }
  } catch {
    res.status(500).json({ error: 'Payment processing error.' });
  }
});

// POST /api/bookings/failed-payment - Simulate failed payment
bookingRouter.post('/failed-payment', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const { flightId, seatNumber } = req.body;
    if (!flightId || !seatNumber) {
      res.status(400).json({ error: 'Flight and seat information required.' });
      return;
    }

    const userId = req.user!.id;
    db.handleFailedPayment(Number(flightId), String(seatNumber).toUpperCase(), userId);

    res.json({
      message: 'Payment simulation failed. Seat lock released and seat is now available.',
    });
  } catch {
    res.status(500).json({ error: 'Failed to handle payment simulation.' });
  }
});

// GET /api/bookings/my - User's bookings
bookingRouter.get('/my', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const userBookings = db.bookings
      .filter(b => b.user_id === userId)
      .map(b => {
        const flight = db.flights.find(f => f.id === b.flight_id);
        const payment = db.payments.find(p => p.booking_id === b.id);
        const refund = db.refunds.find(r => r.booking_id === b.id);

        return {
          ...b,
          flight,
          payment,
          refund,
        };
      })
      .reverse();

    res.json({ bookings: userBookings });
  } catch {
    res.status(500).json({ error: 'Failed to retrieve bookings.' });
  }
});

// GET /api/bookings/pnr/:pnr - View booking by PNR
bookingRouter.get('/pnr/:pnr', (req, res) => {
  try {
    const pnr = req.params.pnr.trim().toUpperCase();
    const booking = db.bookings.find(b => b.pnr.toUpperCase() === pnr);

    if (!booking) {
      res.status(404).json({ error: 'No booking found for this PNR.' });
      return;
    }

    const flight = db.flights.find(f => f.id === booking.flight_id);
    const payment = db.payments.find(p => p.booking_id === booking.id);
    const refund = db.refunds.find(r => r.booking_id === booking.id);

    res.json({
      booking: {
        ...booking,
        flight,
        payment,
        refund,
      },
    });
  } catch {
    res.status(500).json({ error: 'Failed to look up PNR.' });
  }
});

// POST /api/bookings/:id/cancel - Cancel booking with 80% refund in INR
bookingRouter.post('/:id/cancel', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const bookingId = Number(req.params.id);
    const userId = req.user!.id;
    const isAdmin = req.user!.role === 'admin';

    try {
      const result = db.cancelBooking(bookingId, userId, isAdmin);
      res.json({
        message: `Booking cancelled successfully. 80% refund of ₹${result.refund.refund_amount_inr.toLocaleString('en-IN')} processed.`,
        booking: result.booking,
        refund: result.refund,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Cancellation failed';
      res.status(400).json({ error: message });
    }
  } catch {
    res.status(500).json({ error: 'Failed to cancel booking.' });
  }
});

// ADMIN: GET /api/admin/bookings - View all bookings
bookingRouter.get('/admin/all', authenticate, requireAdmin, (_req, res) => {
  try {
    const allBookings = db.bookings
      .map(b => {
        const flight = db.flights.find(f => f.id === b.flight_id);
        const user = db.users.find(u => u.id === b.user_id);
        const payment = db.payments.find(p => p.booking_id === b.id);
        const refund = db.refunds.find(r => r.booking_id === b.id);

        return {
          ...b,
          user_email: user ? user.email : 'Unknown',
          flight,
          payment,
          refund,
        };
      })
      .reverse();

    res.json({ bookings: allBookings });
  } catch {
    res.status(500).json({ error: 'Failed to retrieve all bookings.' });
  }
});

// ADMIN: Aircraft endpoints
bookingRouter.get('/admin/aircraft', authenticate, requireAdmin, (_req, res) => {
  res.json({ aircraft: db.aircraft });
});

bookingRouter.post('/admin/aircraft', authenticate, requireAdmin, (req, res) => {
  try {
    const { model, registration_number, total_seats } = req.body;
    if (!model || !registration_number) {
      res.status(400).json({ error: 'Please provide model and registration number.' });
      return;
    }

    const newAircraft = {
      id: db.aircraft.length + 1,
      model,
      registration_number: registration_number.toUpperCase(),
      total_seats: Number(total_seats) || 24,
      created_at: new Date().toISOString(),
    };
    db.aircraft.push(newAircraft);

    res.status(201).json({ message: 'Aircraft added.', aircraft: newAircraft });
  } catch {
    res.status(500).json({ error: 'Failed to add aircraft.' });
  }
});
