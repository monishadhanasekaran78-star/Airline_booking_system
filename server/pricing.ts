/**
 * ====================================================================
 * SkyBook - Airline Booking System
 * Capstone Project: Object Oriented Software Engineering (BE23CS411)
 * Pattern: Strategy Design Pattern (Behavioral Pattern)
 * ====================================================================
 * 
 * VIVA EXPLANATION:
 * The Strategy Pattern defines a family of pricing algorithms, encapsulates
 * each one as a separate class, and makes them interchangeable.
 * This adheres to the Open/Closed Principle (OCP) - we can introduce
 * new pricing schemes (e.g. FestivalSurgePricing, RedEyeDiscountPricing)
 * without altering existing flight booking logic.
 * 
 * All fares are calculated and displayed in Indian Rupees (₹).
 */

export interface FlightPricingData {
  id: number;
  baseFareInr: number;
  departureTime: string | Date;
  totalSeats: number;
  bookedSeatsCount: number;
}

/**
 * 1. Strategy Interface
 * Declares the method calculate() common to all supported pricing algorithms.
 */
export interface PricingStrategy {
  readonly strategyName: string;
  readonly description: string;
  calculate(flight: FlightPricingData): number;
}

/**
 * 2. Concrete Strategy A: StandardPricing
 * Base fare without surge or demand adjustments. Used during standard off-peak windows.
 */
export class StandardPricing implements PricingStrategy {
  readonly strategyName = 'Standard Pricing';
  readonly description = 'Standard base fare for regular advance bookings.';

  calculate(flight: FlightPricingData): number {
    return Math.round(flight.baseFareInr);
  }
}

/**
 * 2. Concrete Strategy B: DemandPricing
 * Yield management: Price increases proportionally as flight occupancy increases.
 * - Occupancy >= 75%: +30% surge
 * - Occupancy >= 50%: +15% surge
 * - Otherwise: standard fare
 */
export class DemandPricing implements PricingStrategy {
  readonly strategyName = 'Demand-Based Pricing';
  readonly description = 'Dynamic yield pricing based on aircraft seat occupancy.';

  calculate(flight: FlightPricingData): number {
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

/**
 * 2. Concrete Strategy C: LastMinutePricing
 * Applied when flight departure is within 3 days (72 hours).
 * Higher surge (+25%) due to urgent travel demand.
 */
export class LastMinutePricing implements PricingStrategy {
  readonly strategyName = 'Last-Minute Surge Pricing';
  readonly description = 'Applied when departure is within 72 hours of booking.';

  calculate(flight: FlightPricingData): number {
    const now = new Date().getTime();
    const depTime = new Date(flight.departureTime).getTime();
    const hoursToDeparture = (depTime - now) / (1000 * 60 * 60);

    // If departing within 72 hours, apply a 25% surge
    let multiplier = 1.0;
    if (hoursToDeparture <= 72 && hoursToDeparture > 0) {
      multiplier = 1.25;
    }

    return Math.round((flight.baseFareInr * multiplier) / 10) * 10;
  }
}

/**
 * 3. Context Class: PriceContext
 * Maintains a reference to one of the concrete PricingStrategy objects
 * and delegates algorithm execution to it.
 */
export class PriceContext {
  private strategy: PricingStrategy;

  constructor(initialStrategy?: PricingStrategy) {
    this.strategy = initialStrategy || new StandardPricing();
  }

  /**
   * Allows hot-swapping strategies at runtime
   */
  public setStrategy(strategy: PricingStrategy): void {
    this.strategy = strategy;
  }

  public getStrategyName(): string {
    return this.strategy.strategyName;
  }

  public getStrategyDescription(): string {
    return this.strategy.description;
  }

  /**
   * Executes the selected pricing strategy algorithm
   */
  public executeStrategy(flight: FlightPricingData): number {
    return this.strategy.calculate(flight);
  }

  /**
   * Factory method: Automatically resolves the best pricing strategy
   * based on flight parameters (occupancy and departure countdown).
   */
  public static resolveStrategy(flight: FlightPricingData): PricingStrategy {
    const now = new Date().getTime();
    const depTime = new Date(flight.departureTime).getTime();
    const hoursToDeparture = (depTime - now) / (1000 * 60 * 60);
    const occupancyRate = flight.totalSeats > 0 ? (flight.bookedSeatsCount / flight.totalSeats) : 0;

    // Priority 1: High demand (> 50% booked)
    if (occupancyRate >= 0.50) {
      return new DemandPricing();
    }

    // Priority 2: Last minute departure (within 3 days)
    if (hoursToDeparture <= 72 && hoursToDeparture > 0) {
      return new LastMinutePricing();
    }

    // Default: Standard
    return new StandardPricing();
  }
}
