import React, { useState, useEffect } from 'react';
import { Booking } from '../types';
import { formatINR, formatISTDate, formatISTTime } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, CheckCircle2, Search, XCircle, RefreshCw } from 'lucide-react';

interface MyBookingsProps {
  onSelectBookingTicket?: (booking: Booking) => void;
}

export const MyBookings: React.FC<MyBookingsProps> = ({ onSelectBookingTicket }) => {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation modal state
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [isProcessingCancel, setIsProcessingCancel] = useState<boolean>(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  // PNR quick search state
  const [searchPnr, setSearchPnr] = useState<string>('');
  const [pnrSearchResult, setPnrSearchResult] = useState<Booking | null>(null);
  const [pnrSearchError, setPnrSearchError] = useState<string | null>(null);
  const [isSearchingPnr, setIsSearchingPnr] = useState<boolean>(false);

  const fetchBookings = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/bookings/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load bookings.');
      } else {
        setBookings(data.bookings || []);
      }
    } catch {
      setError('Network error while retrieving bookings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [token]);

  const handleCancelBooking = async () => {
    if (!cancellingBooking || !token) return;

    setIsProcessingCancel(true);
    try {
      const res = await fetch(`/api/bookings/${cancellingBooking.id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to cancel booking.');
      } else {
        setCancelSuccessMsg(data.message);
        setCancellingBooking(null);
        await fetchBookings();
      }
    } catch {
      alert('Error communicating with cancellation server.');
    } finally {
      setIsProcessingCancel(false);
    }
  };

  const handlePnrSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPnr.trim()) return;

    setIsSearchingPnr(true);
    setPnrSearchError(null);
    setPnrSearchResult(null);

    try {
      const res = await fetch(`/api/bookings/pnr/${searchPnr.trim().toUpperCase()}`);
      const data = await res.json();
      if (!res.ok) {
        setPnrSearchError(data.error || 'No booking found for this PNR.');
      } else {
        setPnrSearchResult(data.booking);
      }
    } catch {
      setPnrSearchError('Network error during PNR lookup.');
    } finally {
      setIsSearchingPnr(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Quick PNR Search Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">My Bookings</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your confirmed domestic flights, download tickets, or request cancellations
            </p>
          </div>

          <form onSubmit={handlePnrSearch} className="flex items-center gap-2">
            <input
              type="text"
              value={searchPnr}
              onChange={(e) => setSearchPnr(e.target.value)}
              placeholder="Search by PNR (e.g. SKB9X2M4)"
              className="px-3 py-1.5 border border-slate-300 rounded-md text-xs text-slate-900 uppercase font-medium focus:outline-hidden focus:border-[#0f294a]"
            />
            <button
              type="submit"
              disabled={isSearchingPnr}
              className="px-3 py-1.5 bg-[#0f294a] text-white rounded-md text-xs font-medium hover:bg-[#163b69] transition-colors"
            >
              {isSearchingPnr ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {/* PNR Search result box */}
        {pnrSearchResult && (
          <div className="mt-4 p-4 bg-blue-50/60 border border-blue-200 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0f294a]">
                PNR Lookup: {pnrSearchResult.pnr} ({pnrSearchResult.booking_status})
              </span>
              <button
                onClick={() => setPnrSearchResult(null)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>
            <div className="mt-2 text-xs text-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>Passenger: <strong>{pnrSearchResult.passenger_name}</strong></div>
              <div>Flight: <strong>{pnrSearchResult.flight?.flight_number || 'SK Flight'}</strong></div>
              <div>Seat: <strong>{pnrSearchResult.seat_number}</strong></div>
              <div>Fare: <strong>{formatINR(pnrSearchResult.total_amount_inr)}</strong></div>
            </div>
          </div>
        )}

        {pnrSearchError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-800">
            {pnrSearchError}
          </div>
        )}
      </div>

      {cancelSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{cancelSuccessMsg}</span>
          </div>
          <button
            onClick={() => setCancelSuccessMsg(null)}
            className="text-emerald-700 font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Bookings Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Booking History ({bookings.length})
          </span>
          <button
            onClick={fetchBookings}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            title="Refresh bookings"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading your bookings...</div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-red-600">{error}</div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-700">No bookings yet</p>
            <p className="text-xs text-slate-500">Search for domestic flights and book your seat.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">PNR</th>
                  <th className="py-3 px-4">Flight</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Travel Date</th>
                  <th className="py-3 px-4">Passenger</th>
                  <th className="py-3 px-4">Seat</th>
                  <th className="py-3 px-4 text-right">Fare Paid</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => {
                  const isConfirmed = b.booking_status === 'CONFIRMED';
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0f294a]">
                        {b.pnr}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {b.flight?.flight_number || 'SK Flight'}
                      </td>
                      <td className="py-3.5 px-4">
                        {b.flight ? `${b.flight.origin_code} &rarr; ${b.flight.destination_code}` : '--'}
                      </td>
                      <td className="py-3.5 px-4">
                        {b.flight ? formatISTDate(b.flight.departure_time) : '--'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{b.passenger_name}</div>
                        <div className="text-[10px] text-slate-500">{b.passenger_phone}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {b.seat_number}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatINR(b.total_amount_inr)}
                      </td>
                      <td className="py-3.5 px-4">
                        {isConfirmed ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Confirmed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                            Cancelled (Refunded)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {isConfirmed && onSelectBookingTicket && (
                            <button
                              onClick={() => b.flight && onSelectBookingTicket(b)}
                              className="px-2.5 py-1 text-[11px] font-medium text-[#0f294a] bg-slate-100 hover:bg-slate-200 rounded-sm transition-colors"
                            >
                              Ticket
                            </button>
                          )}

                          {isConfirmed && (
                            <button
                              onClick={() => setCancellingBooking(b)}
                              className="px-2.5 py-1 text-[11px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-sm transition-colors"
                            >
                              Cancel
                            </button>
                          )}

                          {!isConfirmed && b.refund && (
                            <span className="text-[11px] text-slate-500">
                              Refund: <strong>{formatINR(b.refund.refund_amount_inr)}</strong>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancellation & 80% Refund Modal */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 max-w-md w-full p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">Cancel Booking</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel booking PNR <strong>{cancellingBooking.pnr}</strong> for passenger <strong>{cancellingBooking.passenger_name}</strong>?
            </p>

            {/* Refund calculation breakdown */}
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Original Fare Paid:</span>
                <span className="font-semibold text-slate-900">{formatINR(cancellingBooking.total_amount_inr)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Cancellation Charges (20%):</span>
                <span className="font-semibold text-rose-700">
                  - {formatINR(Math.round(cancellingBooking.total_amount_inr * 0.2))}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold">
                <span className="text-emerald-900">Refund Amount (80%):</span>
                <span className="text-emerald-700">
                  {formatINR(Math.round(cancellingBooking.total_amount_inr * 0.8))}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Seat {cancellingBooking.seat_number} will immediately become available for other passengers, and the 80% refund will be credited to your payment source.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isProcessingCancel}
                onClick={() => setCancellingBooking(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={isProcessingCancel}
                onClick={handleCancelBooking}
                className="px-4 py-2 text-xs font-medium text-white bg-rose-700 hover:bg-rose-800 rounded-md transition-colors disabled:opacity-50"
              >
                {isProcessingCancel ? 'Processing Refund...' : `Confirm & Refund ${formatINR(Math.round(cancellingBooking.total_amount_inr * 0.8))}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
