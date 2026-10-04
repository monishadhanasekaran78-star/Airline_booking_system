import React from 'react';
import { Booking, Flight, Payment } from '../types';
import { formatINR, formatISTDate, formatISTTime } from '../utils/format';
import { CheckCircle2, Plane, Printer, ArrowRight } from 'lucide-react';

interface BookingTicketProps {
  booking: Booking;
  flight: Flight;
  payment?: Payment;
  onBookAnother: () => void;
  onViewMyBookings: () => void;
}

export const BookingTicket: React.FC<BookingTicketProps> = ({
  booking,
  flight,
  payment,
  onBookAnother,
  onViewMyBookings,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Success banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <h2 className="text-sm font-bold text-emerald-950">Booking Confirmed</h2>
            <p className="text-xs text-emerald-800">
              Your e-ticket has been generated. PNR: <strong>{booking.pnr}</strong>
            </p>
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 text-xs font-medium text-emerald-900 rounded-md hover:bg-emerald-100 transition-colors shadow-xs"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print</span>
        </button>
      </div>

      {/* Printable Boarding Pass Card */}
      <div className="bg-white border border-slate-300 rounded-md overflow-hidden shadow-xs print:border-none print:shadow-none">
        {/* Pass Header */}
        <div className="bg-[#0f294a] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5 rotate-45" />
            <span className="font-bold tracking-tight text-base">SkyBook Airlines</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-300 uppercase tracking-widest block">Electronic Boarding Pass</span>
            <span className="text-sm font-mono font-bold tracking-wider text-amber-400">{booking.pnr}</span>
          </div>
        </div>

        {/* Flight Route Banner */}
        <div className="p-5 border-b border-dashed border-slate-300 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-black text-slate-900">{flight.origin_code}</div>
              <div className="text-xs text-slate-500 font-medium">{flight.origin_city}</div>
              <div className="text-sm font-semibold text-slate-800 mt-1">{formatISTTime(flight.departure_time)}</div>
            </div>

            <div className="flex flex-col items-center px-4">
              <span className="text-xs font-bold text-[#0f294a] tracking-wider uppercase mb-1">
                {flight.flight_number}
              </span>
              <div className="flex items-center gap-1 text-slate-400">
                <div className="w-12 h-px bg-slate-300"></div>
                <Plane className="w-4 h-4 text-slate-500 rotate-90" />
                <div className="w-12 h-px bg-slate-300"></div>
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold mt-1">Confirmed Non-stop</span>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black text-slate-900">{flight.destination_code}</div>
              <div className="text-xs text-slate-500 font-medium">{flight.destination_city}</div>
              <div className="text-sm font-semibold text-slate-800 mt-1">{formatISTTime(flight.arrival_time)}</div>
            </div>
          </div>
        </div>

        {/* Passenger & Ticket Data Grid */}
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Passenger</span>
            <span className="text-sm font-bold text-slate-900 block mt-0.5">{booking.passenger_name}</span>
            <span className="text-[11px] text-slate-500">{booking.passenger_age} Yrs &bull; {booking.passenger_gender}</span>
          </div>

          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Seat</span>
            <span className="text-base font-black text-[#0f294a] block mt-0.5">{booking.seat_number}</span>
            <span className="text-[11px] text-slate-500">{booking.seat_number.startsWith('1') ? 'Premium Economy' : 'Economy'}</span>
          </div>

          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Date</span>
            <span className="text-sm font-bold text-slate-900 block mt-0.5">{formatISTDate(flight.departure_time)}</span>
            <span className="text-[11px] text-slate-500">Boarding 45m prior</span>
          </div>

          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Total Fare</span>
            <span className="text-sm font-bold text-[#0f294a] block mt-0.5">{formatINR(booking.total_amount_inr)}</span>
            <span className="text-[11px] text-emerald-700 font-medium">Paid via {payment?.payment_method || 'UPI'}</span>
          </div>
        </div>

        {/* Transaction & Barcode Mock Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div>
            <div>Txn ID: <span className="font-mono text-slate-700">{payment?.transaction_id || 'TXN-98401234-SKB'}</span></div>
            <div>Contact: <span className="text-slate-700">{booking.passenger_phone}</span></div>
          </div>

          {/* Barcode visual */}
          <div className="font-mono text-center">
            <div className="tracking-[0.3em] font-black text-slate-800 text-sm select-none">
              ||| | |||| || | ||||| ||| ||||
            </div>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest">{booking.pnr}</span>
          </div>
        </div>
      </div>

      {/* Post-Booking Action Row */}
      <div className="flex items-center justify-between gap-3 pt-2 print:hidden">
        <button
          onClick={onBookAnother}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors"
        >
          Book Another Flight
        </button>

        <button
          onClick={onViewMyBookings}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#0f294a] hover:bg-[#163b69] rounded-md transition-colors shadow-xs"
        >
          <span>View in My Bookings</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
