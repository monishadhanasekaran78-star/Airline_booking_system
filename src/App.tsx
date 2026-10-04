import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { FlightSearch } from './components/FlightSearch';
import { FlightCard } from './components/FlightCard';
import { SeatMap } from './components/SeatMap';
import { PassengerForm } from './components/PassengerForm';
import { PaymentModal } from './components/PaymentModal';
import { BookingTicket } from './components/BookingTicket';
import { MyBookings } from './components/MyBookings';
import { AdminPortal } from './components/AdminPortal';
import { AuthModal } from './components/AuthModal';
import { Flight, Seat, Booking } from './types';
import { ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';

function SkyBookApp() {
  const { user } = useAuth();

  // Active top navigation tab
  const [activeTab, setActiveTab] = useState<'search' | 'my-bookings' | 'admin'>('search');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Search filters
  const [fromCode, setFromCode] = useState<string>('');
  const [toCode, setToCode] = useState<string>('');
  const [travelDate, setTravelDate] = useState<string>('2026-10-05');

  // Flight list state
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoadingFlights, setIsLoadingFlights] = useState<boolean>(true);
  const [flightSearchError, setFlightSearchError] = useState<string | null>(null);

  // Booking Flow Steps:
  // 'search' -> 'seats' -> 'passenger' -> 'ticket'
  const [bookingStep, setBookingStep] = useState<'search' | 'seats' | 'passenger' | 'ticket'>('search');

  // Currently selected entities
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [flightSeats, setFlightSeats] = useState<Seat[]>([]);
  const [isLoadingSeats, setIsLoadingSeats] = useState<boolean>(false);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [isLocking, setIsLocking] = useState<boolean>(false);
  const [lockError, setLockError] = useState<string | null>(null);

  // 5-minute Seat Lock Timer (300 seconds)
  const [lockTimeRemaining, setLockTimeRemaining] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Passenger form details
  const [passengerData, setPassengerData] = useState<{
    passengerName: string;
    passengerAge: number;
    passengerGender: 'Male' | 'Female' | 'Other';
    passengerPhone: string;
  } | null>(null);

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // Confirmed booking for ticket view
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Quick feedback banner
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Fetch flights on load or when search triggers
  const fetchFlights = async () => {
    setIsLoadingFlights(true);
    setFlightSearchError(null);
    try {
      const params = new URLSearchParams();
      if (fromCode) params.append('from', fromCode);
      if (toCode) params.append('to', toCode);
      if (travelDate) params.append('date', travelDate);

      const res = await fetch(`/api/flights?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setFlightSearchError(data.error || 'Failed to find flights.');
      } else {
        setFlights(data.flights || []);
      }
    } catch {
      setFlightSearchError('Network error connecting to SkyBook flight servers.');
    } finally {
      setIsLoadingFlights(false);
    }
  };

  useEffect(() => {
    fetchFlights();
  }, []);

  // Timer countdown hook for 5-minute seat lock
  useEffect(() => {
    if (lockTimeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setLockTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleLockExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lockTimeRemaining]);

  const handleLockExpired = () => {
    setStatusBanner('Your 5-minute seat hold expired. The seat has been released.');
    setSelectedSeat(null);
    setIsPaymentModalOpen(false);
    if (selectedFlight) {
      loadFlightSeats(selectedFlight.id);
    }
  };

  // Load seats for a flight
  const loadFlightSeats = async (flightId: number) => {
    setIsLoadingSeats(true);
    setLockError(null);
    try {
      const token = localStorage.getItem('skybook_jwt');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/flights/${flightId}/seats`, { headers });
      const data = await res.json();
      if (res.ok) {
        setFlightSeats(data.seats || []);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoadingSeats(false);
    }
  };

  // User selects a flight from results
  const handleSelectFlight = (flight: Flight) => {
    setSelectedFlight(flight);
    setSelectedSeat(null);
    setLockTimeRemaining(0);
    setLockError(null);
    loadFlightSeats(flight.id);
    setBookingStep('seats');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // User selects a seat on the cabin map
  const handleLockSeat = async (seat: Seat): Promise<boolean> => {
    if (!user) {
      setIsAuthModalOpen(true);
      return false;
    }

    if (!selectedFlight) return false;

    setIsLocking(true);
    setLockError(null);

    try {
      const token = localStorage.getItem('skybook_jwt');
      const res = await fetch(`/api/flights/${selectedFlight.id}/lock-seat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ seatNumber: seat.seat_number }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Concurrency collision: e.g. "Seat already taken"
        setLockError(data.error || 'Seat already taken.');
        await loadFlightSeats(selectedFlight.id);
        setIsLocking(false);
        return false;
      }

      // Lock acquired successfully for 5 minutes
      setSelectedSeat(seat);
      setLockTimeRemaining(300); // 5 minutes = 300 seconds
      await loadFlightSeats(selectedFlight.id);
      setIsLocking(false);
      return true;
    } catch {
      setLockError('Failed to communicate with reservation lock engine.');
      setIsLocking(false);
      return false;
    }
  };

  // User submits passenger form
  const handlePassengerSubmit = (data: {
    passengerName: string;
    passengerAge: number;
    passengerGender: 'Male' | 'Female' | 'Other';
    passengerPhone: string;
  }) => {
    setPassengerData(data);
    setIsPaymentModalOpen(true);
  };

  // User confirms payment: "Pay Now"
  const handlePaymentSuccess = async (paymentMethod: string) => {
    if (!selectedFlight || !selectedSeat || !passengerData) return;

    setIsProcessingPayment(true);
    try {
      const token = localStorage.getItem('skybook_jwt');
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          flightId: selectedFlight.id,
          seatNumber: selectedSeat.seat_number,
          passengerName: passengerData.passengerName,
          passengerAge: passengerData.passengerAge,
          passengerGender: passengerData.passengerGender,
          passengerPhone: passengerData.passengerPhone,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Payment confirmation failed.');
        setIsProcessingPayment(false);
        return;
      }

      // Booking confirmed
      setConfirmedBooking(data.booking);
      setIsPaymentModalOpen(false);
      setLockTimeRemaining(0);
      setBookingStep('ticket');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      alert('Network error confirming payment.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // User triggers: "Simulate Failed Payment"
  const handlePaymentFail = async () => {
    if (!selectedFlight || !selectedSeat) return;

    setIsProcessingPayment(true);
    try {
      const token = localStorage.getItem('skybook_jwt');
      await fetch('/api/bookings/failed-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          flightId: selectedFlight.id,
          seatNumber: selectedSeat.seat_number,
        }),
      });

      setIsPaymentModalOpen(false);
      setSelectedSeat(null);
      setLockTimeRemaining(0);
      setStatusBanner('Payment failed simulation triggered. Seat lock released and returned to AVAILABLE.');
      await loadFlightSeats(selectedFlight.id);
      setBookingStep('seats');
    } catch {
      alert('Failed to simulate payment failure.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleResetSearch = () => {
    setFromCode('');
    setToCode('');
    setTravelDate('2026-10-05');
    fetchFlights();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-100 selection:text-slate-900">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'search') {
            setBookingStep('search');
          }
        }}
        openAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Status banner */}
      {statusBanner && (
        <div className="bg-amber-50 border-b border-amber-200 py-2.5 px-4 text-xs text-amber-900 flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <span>{statusBanner}</span>
            <button
              onClick={() => setStatusBanner(null)}
              className="text-amber-700 font-bold hover:underline ml-4"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: Search & Booking Flow */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            {bookingStep === 'search' && (
              <>
                {/* Search Bar */}
                <FlightSearch
                  fromCode={fromCode}
                  setFromCode={setFromCode}
                  toCode={toCode}
                  setToCode={setToCode}
                  travelDate={travelDate}
                  setTravelDate={setTravelDate}
                  onSearch={fetchFlights}
                  onReset={handleResetSearch}
                />

                {/* Flights List Header */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Indian Domestic Flights ({flights.length})
                  </div>
                  <button
                    onClick={fetchFlights}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                    title="Refresh flight fares"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Flights Results */}
                {isLoadingFlights ? (
                  <div className="bg-white border border-slate-200 rounded-md p-12 text-center text-xs text-slate-500">
                    Searching Indian domestic schedules...
                  </div>
                ) : flightSearchError ? (
                  <div className="bg-white border border-red-200 rounded-md p-8 text-center text-xs text-red-600">
                    {flightSearchError}
                  </div>
                ) : flights.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-md p-12 text-center space-y-2">
                    <p className="text-sm font-semibold text-slate-800">No scheduled flights found</p>
                    <p className="text-xs text-slate-500">
                      Try clearing filters or search another Indian route like Chennai (MAA) to Delhi (DEL).
                    </p>
                    <button
                      onClick={handleResetSearch}
                      className="mt-2 px-4 py-1.5 text-xs font-medium text-white bg-[#0f294a] rounded-md"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {flights.map((f) => (
                      <FlightCard
                        key={f.id}
                        flight={f}
                        onSelect={handleSelectFlight}
                        isSelected={selectedFlight?.id === f.id}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Step 2: Seat Map */}
            {bookingStep === 'seats' && selectedFlight && (
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setBookingStep('search');
                    setSelectedSeat(null);
                    setLockTimeRemaining(0);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Flight Results</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Seat Map component */}
                  <div className="lg:col-span-7">
                    <SeatMap
                      flight={selectedFlight}
                      seats={flightSeats}
                      selectedSeat={selectedSeat}
                      onSelectSeat={(seat) => setSelectedSeat(seat)}
                      onLockSeat={handleLockSeat}
                      lockTimeRemaining={lockTimeRemaining}
                      isLocking={isLocking}
                      lockError={lockError}
                    />
                  </div>

                  {/* Passenger Form side panel (active when seat is locked) */}
                  <div className="lg:col-span-5">
                    {selectedSeat ? (
                      <PassengerForm
                        initialName={user?.name || ''}
                        initialPhone={user?.phone || '+91 98401 23456'}
                        seatNumber={selectedSeat.seat_number}
                        fareInr={selectedSeat.price_inr}
                        onBack={() => setSelectedSeat(null)}
                        onSubmit={handlePassengerSubmit}
                      />
                    ) : (
                      <div className="bg-white border border-slate-200 rounded-md p-6 text-center space-y-3 shadow-xs">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
                          1A
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">Choose a Seat to Continue</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Click any available white seat on the aircraft layout. The seat will be held exclusively for 5 minutes while you enter passenger details and pay.
                        </p>
                        <div className="pt-2 text-[11px] text-slate-400">
                          Row 1 features Premium Economy legroom (+₹800). Rows 2 to 4 are standard Economy.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Confirmed Ticket View */}
            {bookingStep === 'ticket' && confirmedBooking && selectedFlight && (
              <BookingTicket
                booking={confirmedBooking}
                flight={selectedFlight}
                onBookAnother={() => {
                  setSelectedFlight(null);
                  setSelectedSeat(null);
                  setConfirmedBooking(null);
                  setBookingStep('search');
                  fetchFlights();
                }}
                onViewMyBookings={() => {
                  setActiveTab('my-bookings');
                  setBookingStep('search');
                }}
              />
            )}
          </div>
        )}

        {/* TAB 2: My Bookings */}
        {activeTab === 'my-bookings' && (
          <MyBookings
            onSelectBookingTicket={(booking) => {
              if (booking.flight) {
                setSelectedFlight(booking.flight);
                setConfirmedBooking(booking);
                setBookingStep('ticket');
                setActiveTab('search');
              }
            }}
          />
        )}

        {/* TAB 3: Admin Portal */}
        {activeTab === 'admin' && <AdminPortal />}
      </main>

      {/* Payment Checkout Modal */}
      {isPaymentModalOpen && selectedFlight && selectedSeat && passengerData && (
        <PaymentModal
          flight={selectedFlight}
          seat={selectedSeat}
          passengerDetails={passengerData}
          onSuccess={handlePaymentSuccess}
          onFail={handlePaymentFail}
          onCancel={() => setIsPaymentModalOpen(false)}
          lockTimeRemaining={lockTimeRemaining}
          isProcessing={isProcessingPayment}
        />
      )}

      {/* Login & Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Simple Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div>
            <span className="font-bold text-[#0f294a]">SkyBook Airlines</span> &bull; Indian Domestic Flight Booking
          </div>
          <div className="text-[11px] text-slate-400">
            All fares in Indian Rupees (₹) &bull; Safe and Secure Online Reservation
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SkyBookApp />
    </AuthProvider>
  );
}
