import React from 'react';
import { Flight } from '../types';
import { formatINR, formatISTTime, formatISTDate, calculateDuration } from '../utils/format';
import { ArrowRight, Plane, Info } from 'lucide-react';

interface FlightCardProps {
  flight: Flight;
  onSelect: (flight: Flight) => void;
  isSelected?: boolean;
}

export const FlightCard: React.FC<FlightCardProps> = ({
  flight,
  onSelect,
  isSelected,
}) => {
  const duration = calculateDuration(flight.departure_time, flight.arrival_time);
  const fare = flight.dynamic_fare_inr || flight.base_fare_inr;
  const isAvailable = (flight.available_seats ?? 24) > 0;

  return (
    <div
      className={`bg-white border rounded-md p-4 transition-all duration-150 ${
        isSelected
          ? 'border-[#0f294a] ring-1 ring-[#0f294a] shadow-xs'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Airline & Flight Number */}
        <div className="flex items-center gap-3 min-w-[140px]">
          <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center text-[#0f294a] shrink-0">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm tracking-tight">
              {flight.flight_number}
            </div>
            <div className="text-xs text-slate-500">
              {flight.aircraft_model || 'Airbus A320'}
            </div>
          </div>
        </div>

        {/* Timings & Duration */}
        <div className="flex items-center gap-6 sm:gap-10">
          {/* Departure */}
          <div className="text-left">
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {formatISTTime(flight.departure_time)}
            </div>
            <div className="text-xs font-semibold text-slate-700">
              {flight.origin_code}
            </div>
            <div className="text-[11px] text-slate-500">
              {flight.origin_city}
            </div>
          </div>

          {/* Route Duration Indicator */}
          <div className="flex flex-col items-center min-w-[90px]">
            <span className="text-[11px] font-medium text-slate-500 mb-1">{duration}</span>
            <div className="w-full flex items-center">
              <div className="h-[1.5px] flex-1 bg-slate-300"></div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 -ml-1" />
            </div>
            <span className="text-[10px] text-emerald-700 font-medium mt-1">Non-stop</span>
          </div>

          {/* Arrival */}
          <div className="text-left">
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {formatISTTime(flight.arrival_time)}
            </div>
            <div className="text-xs font-semibold text-slate-700">
              {flight.destination_code}
            </div>
            <div className="text-[11px] text-slate-500">
              {flight.destination_city}
            </div>
          </div>
        </div>

        {/* Date and Availability badge */}
        <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between text-xs text-slate-500 border-t lg:border-t-0 pt-2 lg:pt-0">
          <div>{formatISTDate(flight.departure_time)}</div>
          <div className="mt-1">
            {flight.available_seats !== undefined && (
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-sm ${
                  flight.available_seats <= 4
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {flight.available_seats} {flight.available_seats === 1 ? 'seat' : 'seats'} left
              </span>
            )}
          </div>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0">
          <div className="text-left lg:text-right">
            <div className="text-xl font-bold text-[#0f294a] leading-none">
              {formatINR(fare)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              per adult
            </div>
          </div>

          <button
            onClick={() => onSelect(flight)}
            disabled={!isAvailable}
            className={`px-5 py-2 text-sm font-medium rounded-md transition-colors shadow-xs ${
              !isAvailable
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : isSelected
                ? 'bg-[#0f294a] text-white'
                : 'bg-[#e65100] hover:bg-[#cf4700] text-white'
            }`}
          >
            {!isAvailable ? 'Sold Out' : isSelected ? 'Selected' : 'Select'}
          </button>
        </div>
      </div>
    </div>
  );
};
