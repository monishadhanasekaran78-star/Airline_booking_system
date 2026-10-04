import { Router } from 'express';
import { db } from '../db';
import {
  PriceContext,
  StandardPricing,
  DemandPricing,
  LastMinutePricing,
} from '../pricing';

export const pricingRouter = Router();

// GET /api/pricing/explain/:flightId
pricingRouter.get('/explain/:flightId', (req, res) => {
  try {
    const flightId = Number(req.params.flightId);
    const flight = db.flights.find(f => f.id === flightId);
    if (!flight) {
      res.status(404).json({ error: 'Flight not found.' });
      return;
    }

    const seats = db.seats.filter(s => s.flight_id === flightId);
    const bookedCount = seats.filter(s => s.status === 'BOOKED').length;
    const totalSeats = seats.length || 24;
    const occupancyRate = (bookedCount / totalSeats) * 100;

    const pricingData = {
      id: flight.id,
      baseFareInr: flight.base_fare_inr,
      departureTime: flight.departure_time,
      totalSeats,
      bookedSeatsCount: bookedCount,
    };

    const standardStrategy = new StandardPricing();
    const demandStrategy = new DemandPricing();
    const lastMinuteStrategy = new LastMinutePricing();

    const standardFare = standardStrategy.calculate(pricingData);
    const demandFare = demandStrategy.calculate(pricingData);
    const lastMinuteFare = lastMinuteStrategy.calculate(pricingData);

    const activeStrategy = PriceContext.resolveStrategy(pricingData);
    const activeFare = activeStrategy.calculate(pricingData);

    const now = Date.now();
    const depTime = new Date(flight.departure_time).getTime();
    const hoursToDeparture = Math.max(0, Math.round((depTime - now) / (1000 * 60 * 60)));

    res.json({
      flight_number: flight.flight_number,
      route: `${flight.origin_city} (${flight.origin_code}) -> ${flight.destination_city} (${flight.destination_code})`,
      base_fare_inr: flight.base_fare_inr,
      total_seats: totalSeats,
      booked_seats: bookedCount,
      occupancy_percentage: Math.round(occupancyRate),
      hours_to_departure: hoursToDeparture,
      active_strategy: activeStrategy.strategyName,
      active_description: activeStrategy.description,
      final_fare_inr: activeFare,
      comparison: [
        {
          name: standardStrategy.strategyName,
          fare_inr: standardFare,
          description: standardStrategy.description,
          is_active: activeStrategy.strategyName === standardStrategy.strategyName,
        },
        {
          name: demandStrategy.strategyName,
          fare_inr: demandFare,
          description: demandStrategy.description,
          is_active: activeStrategy.strategyName === demandStrategy.strategyName,
        },
        {
          name: lastMinuteStrategy.strategyName,
          fare_inr: lastMinuteFare,
          description: lastMinuteStrategy.description,
          is_active: activeStrategy.strategyName === lastMinuteStrategy.strategyName,
        },
      ],
      viva_notes: {
        pattern: 'Strategy Design Pattern (GoF Behavioral)',
        principles: 'Adheres to Open/Closed Principle (OCP) and Single Responsibility Principle (SRP)',
        explanation:
          'PriceContext delegates the price calculation to an interchangeable IPricingStrategy implementation. At runtime, resolveStrategy() inspects occupancy rate and departure urgency to select the appropriate concrete pricing strategy without modifying flight booking services.',
      },
    });
  } catch {
    res.status(500).json({ error: 'Failed to explain pricing strategy.' });
  }
});
