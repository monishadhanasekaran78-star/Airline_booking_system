import { Router } from 'express';
import { db } from '../db';
import { authenticate, optionalAuthenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

export const flightRouter = Router();

// GET /api/flights - Search flights with dynamic pricing
flightRouter.get('/', (req, res) => {
  try {
    db.cleanupExpiredLocks();
    const { from, to, date } = req.query;

    let results = db.flights;

    if (from && typeof from === 'string' && from.trim() !== '') {
      const qFrom = from.trim().toUpperCase();
      results = results.filter(
        f => f.origin_code.toUpperCase() === qFrom || f.origin_city.toUpperCase().includes(qFrom)
      );
    }

    if (to && typeof to === 'string' && to.trim() !== '') {
      const qTo = to.trim().toUpperCase();
      results = results.filter(
        f => f.destination_code.toUpperCase() === qTo || f.destination_city.toUpperCase().includes(qTo)
      );
    }

    if (date && typeof date === 'string' && date.trim() !== '') {
      const targetDate = date.trim().split('T')[0];
      results = results.filter(f => f.departure_time.split('T')[0] === targetDate);
    }

    // Attach dynamic pricing and aircraft info
    const enrichedFlights = results.map(f => {
      const flightWithDynamic = db.getFlightWithDynamicFare(f);
      const aircraft = db.aircraft.find(a => a.id === f.aircraft_id);
      const seats = db.seats.filter(s => s.flight_id === f.id);
      const availableSeats = seats.filter(s => s.status === 'AVAILABLE').length;
      const bookedSeats = seats.filter(s => s.status === 'BOOKED').length;

      return {
        ...flightWithDynamic,
        aircraft_model: aircraft ? aircraft.model : 'Standard Jet',
        aircraft_registration: aircraft ? aircraft.registration_number : 'VT-GEN',
        total_seats: seats.length,
        available_seats: availableSeats,
        booked_seats: bookedSeats,
      };
    });

    res.json({ flights: enrichedFlights });
  } catch {
    res.status(500).json({ error: 'Failed to retrieve flights.' });
  }
});

// GET /api/flights/:id - Get specific flight
flightRouter.get('/:id', (req, res) => {
  try {
    const flightId = Number(req.params.id);
    const flight = db.flights.find(f => f.id === flightId);
    if (!flight) {
      res.status(404).json({ error: 'Flight not found.' });
      return;
    }

    const flightWithDynamic = db.getFlightWithDynamicFare(flight);
    const aircraft = db.aircraft.find(a => a.id === flight.aircraft_id);
    res.json({
      flight: {
        ...flightWithDynamic,
        aircraft_model: aircraft ? aircraft.model : 'Standard Jet',
      },
    });
  } catch {
    res.status(500).json({ error: 'Failed to retrieve flight details.' });
  }
});

// GET /api/flights/:id/seats - Get seat map (Rows 1-4, Cols A-F)
flightRouter.get('/:id/seats', optionalAuthenticate, (req: AuthenticatedRequest, res) => {
  try {
    db.cleanupExpiredLocks();
    const flightId = Number(req.params.id);
    const flight = db.flights.find(f => f.id === flightId);
    if (!flight) {
      res.status(404).json({ error: 'Flight not found.' });
      return;
    }

    const currentUserId = req.user ? req.user.id : null;
    const now = new Date();

    const seats = db.seats
      .filter(s => s.flight_id === flightId)
      .map(s => {
        let isLockedByMe = false;
        let isAvailable = s.status === 'AVAILABLE';

        if (s.status === 'LOCKED') {
          if (s.locked_until && new Date(s.locked_until) <= now) {
            isAvailable = true;
          } else if (currentUserId && s.locked_by === currentUserId) {
            isLockedByMe = true;
          }
        }

        return {
          id: s.id,
          flight_id: s.flight_id,
          seat_number: s.seat_number,
          seat_class: s.seat_class,
          price_inr: s.price_inr,
          status: s.status,
          is_locked_by_me: isLockedByMe,
          is_available: isAvailable,
          locked_until: s.locked_until,
        };
      });

    res.json({
      flight_id: flightId,
      flight_number: flight.flight_number,
      seats,
    });
  } catch {
    res.status(500).json({ error: 'Failed to retrieve seat map.' });
  }
});

// POST /api/flights/:id/lock-seat - Concurrency row-level lock (held for 5 minutes)
flightRouter.post('/:id/lock-seat', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const flightId = Number(req.params.id);
    const { seatNumber } = req.body;

    if (!seatNumber) {
      res.status(400).json({ error: 'Please specify a seat number.' });
      return;
    }

    const userId = req.user!.id;

    try {
      const lockedSeat = await db.lockSeat(flightId, seatNumber, userId);
      res.json({
        message: `Seat ${seatNumber} locked for 5 minutes. Please complete payment.`,
        seat: {
          seat_number: lockedSeat.seat_number,
          price_inr: lockedSeat.price_inr,
          locked_until: lockedSeat.locked_until,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Seat already taken';
      res.status(409).json({ error: message });
    }
  } catch {
    res.status(500).json({ error: 'Failed to lock seat.' });
  }
});

// POST /api/flights/:id/unlock-seat - Releases seat lock
flightRouter.post('/:id/unlock-seat', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const flightId = Number(req.params.id);
    const { seatNumber } = req.body;
    const userId = req.user!.id;

    db.unlockSeat(flightId, seatNumber, userId);
    res.json({ message: `Seat ${seatNumber} unlocked.` });
  } catch {
    res.status(500).json({ error: 'Failed to release seat lock.' });
  }
});

// ADMIN ROUTES: Add, update, delete flight
flightRouter.post('/admin/create', authenticate, requireAdmin, (req, res) => {
  try {
    const {
      flight_number,
      aircraft_id,
      origin_city,
      origin_code,
      destination_city,
      destination_code,
      departure_time,
      arrival_time,
      base_fare_inr,
    } = req.body;

    if (
      !flight_number ||
      !aircraft_id ||
      !origin_city ||
      !origin_code ||
      !destination_city ||
      !destination_code ||
      !departure_time ||
      !arrival_time ||
      !base_fare_inr
    ) {
      res.status(400).json({ error: 'Please provide all flight details.' });
      return;
    }

    const newFlight = db.createFlight({
      flight_number,
      aircraft_id: Number(aircraft_id),
      origin_city,
      origin_code,
      destination_city,
      destination_code,
      departure_time,
      arrival_time,
      base_fare_inr: Number(base_fare_inr),
    });

    res.status(201).json({
      message: 'Flight created successfully with 24 seats.',
      flight: newFlight,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create flight.';
    res.status(400).json({ error: message });
  }
});

flightRouter.put('/admin/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const flightId = Number(req.params.id);
    const updated = db.updateFlight(flightId, req.body);
    res.json({ message: 'Flight updated successfully.', flight: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update flight.';
    res.status(400).json({ error: message });
  }
});

flightRouter.delete('/admin/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const flightId = Number(req.params.id);
    db.deleteFlight(flightId);
    res.json({ message: 'Flight deleted successfully.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete flight.';
    res.status(400).json({ error: message });
  }
});
