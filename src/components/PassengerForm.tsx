import React, { useState } from 'react';
import { User, ShieldCheck } from 'lucide-react';

interface PassengerFormProps {
  initialName?: string;
  initialPhone?: string;
  onSubmit: (data: {
    passengerName: string;
    passengerAge: number;
    passengerGender: 'Male' | 'Female' | 'Other';
    passengerPhone: string;
  }) => void;
  onBack: () => void;
  seatNumber: string;
  fareInr: number;
}

export const PassengerForm: React.FC<PassengerFormProps> = ({
  initialName = '',
  initialPhone = '',
  onSubmit,
  onBack,
  seatNumber,
}) => {
  const [name, setName] = useState(initialName);
  const [age, setAge] = useState<string>('28');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [phone, setPhone] = useState(initialPhone || '+91 98401 23456');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter passenger full name.');
      return;
    }
    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      setError('Please enter a valid age between 1 and 120.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setError(null);
    onSubmit({
      passengerName: name.trim(),
      passengerAge: parsedAge,
      passengerGender: gender,
      passengerPhone: phone.trim(),
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900">Passenger Information</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter details as shown on your Government-issued Photo ID
          </p>
        </div>
        <div className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-sm text-slate-700">
          Seat: {seatNumber}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Full Name (as on Aadhaar / Passport)
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-hidden focus:border-[#0f294a] transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Age */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Age (Years)
            </label>
            <input
              type="number"
              min="1"
              max="120"
              required
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-hidden focus:border-[#0f294a] transition-colors"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as 'Male' | 'Female' | 'Other')}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-hidden focus:border-[#0f294a] transition-colors bg-white cursor-pointer"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Contact Phone */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Indian Mobile Number (for SMS & WhatsApp Ticket)
          </label>
          <input
            type="text"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98401 23456"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-hidden focus:border-[#0f294a] transition-colors"
          />
        </div>

        <div className="pt-2 flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Seat lock is actively protected for 5 minutes during checkout.</span>
        </div>

        {/* Buttons */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          >
            Back to Seat Map
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-medium text-white bg-[#e65100] hover:bg-[#cf4700] rounded-md transition-colors shadow-xs"
          >
            Continue to Payment
          </button>
        </div>
      </form>
    </div>
  );
};
