import React, { useState } from 'react';
import { Flight, Seat } from '../types';
import { formatINR } from '../utils/format';
import { CheckCircle2, XCircle, ShieldCheck, Clock, CreditCard, Smartphone } from 'lucide-react';

interface PaymentModalProps {
  flight: Flight;
  seat: Seat;
  passengerDetails: {
    passengerName: string;
    passengerAge: number;
    passengerGender: 'Male' | 'Female' | 'Other';
    passengerPhone: string;
  };
  onSuccess: (paymentMethod: string) => Promise<void>;
  onFail: () => Promise<void>;
  onCancel: () => void;
  lockTimeRemaining: number;
  isProcessing: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  flight,
  seat,
  passengerDetails,
  onSuccess,
  onFail,
  onCancel,
  lockTimeRemaining,
  isProcessing,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('rahul@okaxis');

  const baseFare = seat.price_inr;
  const userFee = 0; // No hidden fees
  const totalAmount = baseFare + userFee;

  const minutes = Math.floor(lockTimeRemaining / 60);
  const seconds = lockTimeRemaining % 60;
  const timerDisplay = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-none flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-md border border-slate-200 max-w-lg w-full shadow-lg overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="bg-[#0f294a] text-white p-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">Secure Indian Payment Gateway</h3>
            <p className="text-xs text-slate-300">Fast & Safe Online Checkout</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-300">Total Payable</span>
            <div className="text-lg font-bold text-white">{formatINR(totalAmount)}</div>
          </div>
        </div>

        {/* Lock Expiry Notice */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-900 font-medium">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
            <span>Lock reserved for seat {seat.seat_number}</span>
          </div>
          <span className="font-bold">{timerDisplay}</span>
        </div>

        <div className="p-5 space-y-4">
          {/* Booking Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span className="font-medium text-slate-700">Flight</span>
              <span className="font-semibold text-slate-900">{flight.flight_number} ({flight.origin_code} &rarr; {flight.destination_code})</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-700">Passenger</span>
              <span className="font-semibold text-slate-900">{passengerDetails.passengerName} ({passengerDetails.passengerAge}y, {passengerDetails.passengerGender})</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-700">Seat</span>
              <span className="font-semibold text-slate-900">{seat.seat_number} ({seat.seat_class})</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200">
              <span className="font-bold text-slate-800">Amount to Pay</span>
              <span className="font-bold text-[#0f294a] text-sm">{formatINR(totalAmount)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Payment Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMethod('upi')}
                className={`p-2.5 rounded-md border text-xs font-medium flex flex-col items-center justify-center gap-1 transition-colors ${
                  selectedMethod === 'upi'
                    ? 'border-[#0f294a] bg-blue-50/50 text-[#0f294a] font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>UPI (GPay/BHIM)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('card')}
                className={`p-2.5 rounded-md border text-xs font-medium flex flex-col items-center justify-center gap-1 transition-colors ${
                  selectedMethod === 'card'
                    ? 'border-[#0f294a] bg-blue-50/50 text-[#0f294a] font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>RuPay / Cards</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('netbanking')}
                className={`p-2.5 rounded-md border text-xs font-medium flex flex-col items-center justify-center gap-1 transition-colors ${
                  selectedMethod === 'netbanking'
                    ? 'border-[#0f294a] bg-blue-50/50 text-[#0f294a] font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Net Banking</span>
              </button>
            </div>
          </div>

          {/* Method Input */}
          {selectedMethod === 'upi' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Virtual Payment Address (UPI ID)
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="mobile@upi or user@okhdfcbank"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-hidden focus:border-[#0f294a]"
              />
            </div>
          )}

          {selectedMethod === 'card' && (
            <div className="space-y-2">
              <input
                type="text"
                disabled
                value="4532 &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; 8892 (RuPay Platinum)"
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs bg-slate-50 text-slate-600"
              />
            </div>
          )}

          {selectedMethod === 'netbanking' && (
            <select
              disabled
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs bg-slate-50 text-slate-700"
            >
              <option>State Bank of India (SBI)</option>
              <option>HDFC Bank</option>
              <option>ICICI Bank</option>
              <option>Axis Bank</option>
            </select>
          )}

          {/* Security Notice */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>256-bit encrypted checkout. Instant PNR booking confirmation.</span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onSuccess(`UPI (${upiId})`)}
              className="w-full py-2.5 px-4 bg-[#e65100] hover:bg-[#cf4700] text-white font-medium rounded-md text-sm transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isProcessing ? 'Processing Transaction...' : `Pay Now ${formatINR(totalAmount)}`}</span>
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={onFail}
              className="w-full py-2 px-4 bg-white border border-red-300 text-red-700 hover:bg-red-50 font-medium rounded-md text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5 text-red-600" />
              <span>Simulate Failed Payment (Release Lock)</span>
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={onCancel}
              className="w-full py-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancel and Return
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
