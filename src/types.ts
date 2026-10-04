export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'passenger' | 'admin';
  created_at: string;
}

export interface Aircraft {
  id: number;
  model: string;
  registration_number: string;
  total_seats: number;
}

export interface Flight {
  id: number;
  flight_number: string;
  aircraft_id: number;
  aircraft_model?: string;
  aircraft_registration?: string;
  origin_city: string;
  origin_code: string;
  destination_city: string;
  destination_code: string;
  departure_time: string;
  arrival_time: string;
  base_fare_inr: number;
  dynamic_fare_inr?: number;
  strategy_applied?: string;
  status: 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'CANCELLED';
  total_seats?: number;
  available_seats?: number;
  booked_seats?: number;
}

export interface Seat {
  id: number;
  flight_id: number;
  seat_number: string; // e.g. 1A..4F
  seat_class: 'ECONOMY' | 'PREMIUM';
  price_inr: number;
  status: 'AVAILABLE' | 'LOCKED' | 'BOOKED';
  is_locked_by_me?: boolean;
  is_available?: boolean;
  locked_until?: string | null;
}

export interface Booking {
  id: number;
  pnr: string;
  user_id: number;
  user_email?: string;
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
  flight?: Flight;
  payment?: Payment;
  refund?: Refund;
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

export interface PricingStrategyComparison {
  name: string;
  fare_inr: number;
  description: string;
  is_active: boolean;
}

export interface PricingExplanation {
  flight_number: string;
  route: string;
  base_fare_inr: number;
  total_seats: number;
  booked_seats: number;
  occupancy_percentage: number;
  hours_to_departure: number;
  active_strategy: string;
  active_description: string;
  final_fare_inr: number;
  comparison: PricingStrategyComparison[];
  viva_notes: {
    pattern: string;
    principles: string;
    explanation: string;
  };
}
