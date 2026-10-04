/**
 * ====================================================================
 * SkyBook - Airline Booking System
 * Capstone Project: Object Oriented Software Engineering (BE23CS411)
 * Pattern: Strategy Design Pattern (Behavioral Pattern) - pricing.js
 * ====================================================================
 * 
 * VIVA EXPLANATION:
 * The Strategy Pattern defines a family of pricing algorithms, encapsulates
 * each one in a separate class, and makes them interchangeable.
 * This adheres to the Open/Closed Principle (OCP) - we can introduce
 * new pricing schemes without altering existing flight booking logic.
 * 
 * All fares are in Indian Rupees (₹).
 */

class StandardPricing {
  constructor() {
    this.strategyName = 'Standard Pricing';
    this.description = 'Standard base fare for regular advance bookings.';
  }

  calculate(flight) {
    return Math.round(flight.baseFareInr);
  }
}

class DemandPricing {
  constructor() {
    this.strategyName = 'Demand-Based Pricing';
    this.description = 'Dynamic yield pricing based on aircraft seat occupancy.';
  }

  calculate(flight) {
    const occupancyRate = flight.totalSeats > 0 ? (flight.bookedSeatsCount / flight.totalSeats) : 0;
    let multiplier = 1.0;
    if (occupancyRate >= 0.75) {
      multiplier = 1.30; // 30% increase for high occupancy
    } else if (occupancyRate >= 0.50) {
      multiplier = 1.15; // 15% increase for moderate occupancy
    }
    return Math.round((flight.baseFareInr * multiplier) / 10) * 10;
  }
}

class LastMinutePricing {
  constructor() {
    this.strategyName = 'Last-Minute Surge Pricing';
    this.description = 'Applied when departure is within 72 hours (3 days) of booking.';
  }

  calculate(flight) {
    const now = Date.now();
    const depTime = new Date(flight.departureTime).getTime();
    const hoursToDeparture = (depTime - now) / (1000 * 60 * 60);

    let multiplier = 1.0;
    if (hoursToDeparture <= 72 && hoursToDeparture > 0) {
      multiplier = 1.25; // 25% surge within 3 days
    }
    return Math.round((flight.baseFareInr * multiplier) / 10) * 10;
  }
}

class PriceContext {
  constructor(strategy = new StandardPricing()) {
    this.strategy = strategy;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  getStrategyName() {
    return this.strategy.strategyName;
  }

  getStrategyDescription() {
    return this.strategy.description;
  }

  executeStrategy(flight) {
    return this.strategy.calculate(flight);
  }

  static resolveStrategy(flight) {
    const now = Date.now();
    const depTime = new Date(flight.departureTime).getTime();
    const hoursToDeparture = (depTime - now) / (1000 * 60 * 60);
    const occupancyRate = flight.totalSeats > 0 ? (flight.bookedSeatsCount / flight.totalSeats) : 0;

    if (occupancyRate >= 0.50) {
      return new DemandPricing();
    }
    if (hoursToDeparture <= 72 && hoursToDeparture > 0) {
      return new LastMinutePricing();
    }
    return new StandardPricing();
  }
}

module.exports = {
  StandardPricing,
  DemandPricing,
  LastMinutePricing,
  PriceContext,
};
