import React from 'react';
import { ArrowLeftRight, Calendar, MapPin, Search } from 'lucide-react';
import { INDIAN_AIRPORTS } from '../utils/format';

interface FlightSearchProps {
  fromCode: string;
  setFromCode: (val: string) => void;
  toCode: string;
  setToCode: (val: string) => void;
  travelDate: string;
  setTravelDate: (val: string) => void;
  onSearch: () => void;
  onReset: () => void;
}

export const FlightSearch: React.FC<FlightSearchProps> = ({
  fromCode,
  setFromCode,
  toCode,
  setToCode,
  travelDate,
  setTravelDate,
  onSearch,
  onReset,
}) => {
  const handleSwap = () => {
    const temp = fromCode;
    setFromCode(toCode);
    setToCode(temp);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Origin */}
        <div className="md:col-span-4 relative">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            From
          </label>
          <div className="flex items-center border border-slate-300 rounded-md px-3 py-2 bg-slate-50/50 focus-within:border-[#0f294a] focus-within:bg-white transition-colors">
            <MapPin className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <select
              value={fromCode}
              onChange={(e) => setFromCode(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-slate-900 focus:outline-hidden cursor-pointer"
            >
              <option value="">All Indian Origins</option>
              {INDIAN_AIRPORTS.map((airport) => (
                <option key={airport.code} value={airport.code}>
                  {airport.city} ({airport.code}) - {airport.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap button */}
        <div className="hidden md:flex md:col-span-1 justify-center pt-5">
          <button
            type="button"
            onClick={handleSwap}
            title="Swap Origin & Destination"
            className="w-8 h-8 rounded-full border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors shadow-xs"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Destination */}
        <div className="md:col-span-4 relative">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            To
          </label>
          <div className="flex items-center border border-slate-300 rounded-md px-3 py-2 bg-slate-50/50 focus-within:border-[#0f294a] focus-within:bg-white transition-colors">
            <MapPin className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <select
              value={toCode}
              onChange={(e) => setToCode(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-slate-900 focus:outline-hidden cursor-pointer"
            >
              <option value="">All Indian Destinations</option>
              {INDIAN_AIRPORTS.map((airport) => (
                <option key={airport.code} value={airport.code}>
                  {airport.city} ({airport.code}) - {airport.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Departure Date */}
        <div className="md:col-span-3">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Travel Date
          </label>
          <div className="flex items-center border border-slate-300 rounded-md px-3 py-2 bg-slate-50/50 focus-within:border-[#0f294a] focus-within:bg-white transition-colors">
            <Calendar className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-slate-900 focus:outline-hidden cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Action Row */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Quick routes:</span>
          <button
            onClick={() => { setFromCode('MAA'); setToCode('DEL'); }}
            className="hover:text-[#0f294a] hover:underline"
          >
            MAA &rarr; DEL
          </button>
          <span>&bull;</span>
          <button
            onClick={() => { setFromCode('DEL'); setToCode('BOM'); }}
            className="hover:text-[#0f294a] hover:underline"
          >
            DEL &rarr; BOM
          </button>
          <span>&bull;</span>
          <button
            onClick={() => { setFromCode('BOM'); setToCode('BLR'); }}
            className="hover:text-[#0f294a] hover:underline"
          >
            BOM &rarr; BLR
          </button>
          <span>&bull;</span>
          <button
            onClick={() => { setFromCode('BLR'); setToCode('MAA'); }}
            className="hover:text-[#0f294a] hover:underline"
          >
            BLR &rarr; MAA
          </button>
        </div>

        <div className="flex items-center gap-2">
          {(fromCode || toCode || travelDate) && (
            <button
              onClick={onReset}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            >
              Clear
            </button>
          )}

          <button
            onClick={onSearch}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-[#e65100] hover:bg-[#cf4700] rounded-md transition-colors shadow-xs"
          >
            <Search className="w-4 h-4" />
            <span>Search Flights</span>
          </button>
        </div>
      </div>
    </div>
  );
};
