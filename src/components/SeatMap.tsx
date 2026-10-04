import React, { useState, useEffect } from 'react';
import { Seat, Flight } from '../types';
import { formatINR } from '../utils/format';
import { Lock, Clock, AlertCircle } from 'lucide-react';

interface SeatMapProps {
  flight: Flight;
  seats: Seat[];
  selectedSeat: Seat | null;
  onSelectSeat: (seat: Seat) => void;
  onLockSeat: (seat: Seat) => Promise<boolean>;
  lockTimeRemaining: number; // in seconds
  isLocking: boolean;
  lockError: string | null;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  flight,
  seats,
  selectedSeat,
  onSelectSeat,
  onLockSeat,
  lockTimeRemaining,
  isLocking,
  lockError,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'premium' | 'economy'>('all');

  // Format countdown minutes and seconds
  const minutes = Math.floor(lockTimeRemaining / 60);
  const seconds = lockTimeRemaining % 60;
  const timerDisplay = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const rows = [1, 2, 3, 4];
  const leftCols = ['A', 'B', 'C'];
  const rightCols = ['D', 'E', 'F'];

  const getSeat = (row: number, col: string) => {
    return seats.find(s => s.seat_number === `${row}${col}`);
  };

  const handleSeatClick = async (seat: Seat) => {
    if (seat.status === 'BOOKED') return;
    if (seat.status === 'LOCKED' && !seat.is_locked_by_me) return;

    onSelectSeat(seat);
    await onLockSeat(seat);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Select Seat</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Flight {flight.flight_number} &bull; {flight.origin_code} to {flight.destination_code}
          </p>
        </div>

        {/* 5-minute hold timer banner */}
        {lockTimeRemaining > 0 && selectedSeat && (
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-md text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
            <span>
              Seat <strong>{selectedSeat.seat_number}</strong> held for: <strong>{timerDisplay}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Lock error message */}
      {lockError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{lockError}</span>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 py-4 border-b border-slate-100 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border border-slate-300 bg-white rounded-xs"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#0f294a] rounded-xs text-white flex items-center justify-center text-[10px] font-bold">
            ✓
          </div>
          <span>Selected (Held)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-300 border border-slate-400 rounded-xs flex items-center justify-center text-slate-500">
            <Lock className="w-3 h-3" />
          </div>
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-amber-100 border border-amber-300 rounded-xs flex items-center justify-center text-amber-700">
            <Clock className="w-3 h-3" />
          </div>
          <span>Held by another</span>
        </div>
      </div>

      {/* Cabin Visualizer */}
      <div className="py-6 max-w-md mx-auto">
        {/* Cockpit Indicator */}
        <div className="text-center mb-5">
          <div className="inline-block px-8 py-1.5 bg-slate-100 border border-slate-200 rounded-t-xl text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
            Front of Aircraft
          </div>
        </div>

        {/* Column Labels */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 mb-2">
          <div>A</div>
          <div>B</div>
          <div>C</div>
          <div className="text-[10px] text-slate-300 uppercase tracking-wider">Aisle</div>
          <div>D</div>
          <div>E</div>
          <div>F</div>
        </div>

        {/* Seat Grid Rows 1-4 */}
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row} className="relative">
              {row === 1 && (
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#0f294a] mb-1.5 flex items-center justify-between">
                  <span>Row 1: Premium Economy (+₹800)</span>
                  <span className="text-slate-400 font-normal">Extra Legroom</span>
                </div>
              )}
              {row === 2 && (
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mt-2 mb-1.5">
                  Rows 2-4: Economy Class
                </div>
              )}

              <div className="grid grid-cols-7 gap-2 items-center">
                {/* Left side: A, B, C */}
                {leftCols.map((col) => {
                  const seat = getSeat(row, col);
                  return (
                    <SeatButton
                      key={col}
                      seat={seat}
                      isSelected={selectedSeat?.seat_number === `${row}${col}`}
                      onClick={() => seat && handleSeatClick(seat)}
                      isLocking={isLocking}
                    />
                  );
                })}

                {/* Aisle in middle */}
                <div className="text-center text-xs font-bold text-slate-300">
                  {row}
                </div>

                {/* Right side: D, E, F */}
                {rightCols.map((col) => {
                  const seat = getSeat(row, col);
                  return (
                    <SeatButton
                      key={col}
                      seat={seat}
                      isSelected={selectedSeat?.seat_number === `${row}${col}`}
                      onClick={() => seat && handleSeatClick(seat)}
                      isLocking={isLocking}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Seat Summary Footer */}
      {selectedSeat && (
        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-md">
          <div>
            <div className="text-xs text-slate-500">Selected Seat</div>
            <div className="text-sm font-bold text-slate-900">
              Seat {selectedSeat.seat_number} ({selectedSeat.seat_class})
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Seat Fare</div>
            <div className="text-base font-bold text-[#0f294a]">
              {formatINR(selectedSeat.price_inr)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface SeatButtonProps {
  seat?: Seat;
  isSelected: boolean;
  onClick: () => void;
  isLocking: boolean;
}

const SeatButton: React.FC<SeatButtonProps> = ({
  seat,
  isSelected,
  onClick,
  isLocking,
}) => {
  if (!seat) {
    return <div className="h-10 border border-dashed border-slate-200 rounded-sm"></div>;
  }

  const isBooked = seat.status === 'BOOKED';
  const isHeldByOther = seat.status === 'LOCKED' && !seat.is_locked_by_me && !isSelected;
  const isHeldByMe = isSelected || (seat.status === 'LOCKED' && seat.is_locked_by_me);

  let btnClasses = 'border bg-white text-slate-800 hover:border-[#0f294a] hover:bg-slate-50';
  let cursor = 'cursor-pointer';

  if (isBooked) {
    btnClasses = 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed';
    cursor = 'cursor-not-allowed';
  } else if (isHeldByOther) {
    btnClasses = 'bg-amber-100 border-amber-300 text-amber-700 cursor-not-allowed';
    cursor = 'cursor-not-allowed';
  } else if (isHeldByMe) {
    btnClasses = 'bg-[#0f294a] border-[#0f294a] text-white shadow-xs';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isBooked || isHeldByOther || isLocking}
      title={`Seat ${seat.seat_number} - ${formatINR(seat.price_inr)} (${seat.seat_class})`}
      className={`h-11 rounded-xs flex flex-col items-center justify-center transition-all ${btnClasses} ${cursor}`}
    >
      <span className="text-xs font-bold leading-none">{seat.seat_number}</span>
      <span className="text-[9px] opacity-75 mt-0.5 leading-none">
        {isBooked ? 'Booked' : isHeldByOther ? 'Held' : formatINR(seat.price_inr)}
      </span>
    </button>
  );
};
