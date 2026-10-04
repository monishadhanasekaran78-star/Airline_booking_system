import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, User, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
}) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 98401 23456');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (mode === 'login') {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.error || 'Login failed.');
      } else {
        onClose();
      }
    } else {
      if (!name.trim()) {
        setError('Please enter your full name.');
        setIsSubmitting(false);
        return;
      }
      const res = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
      });
      if (!res.success) {
        setError(res.error || 'Registration failed.');
      } else {
        onClose();
      }
    }

    setIsSubmitting(false);
  };

  const fillQuickCredentials = (userType: 'admin' | 'passenger') => {
    setMode('login');
    if (userType === 'admin') {
      setEmail('admin@air.com');
      setPassword('admin123');
    } else {
      setEmail('rahul@example.in');
      setPassword('passenger123');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-none flex items-center justify-center p-4">
      <div className="bg-white rounded-md border border-slate-200 max-w-sm w-full p-5 shadow-lg relative animate-in fade-in duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5">
          <h2 className="text-base font-bold text-slate-900">
            {mode === 'login' ? 'Login to SkyBook' : 'Create Passenger Account'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Indian Domestic Airline Booking System
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 pb-2 border-b-2 transition-colors ${
              mode === 'login' ? 'border-[#0f294a] text-[#0f294a]' : 'border-transparent text-slate-400'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 pb-2 border-b-2 transition-colors ${
              mode === 'register' ? 'border-[#0f294a] text-[#0f294a]' : 'border-transparent text-slate-400'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {mode === 'register' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rahul Sharma"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-hidden focus:border-[#0f294a]"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rahul@example.in"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-hidden focus:border-[#0f294a]"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-hidden focus:border-[#0f294a]"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Indian Mobile (+91)</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98401 23456"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-hidden focus:border-[#0f294a]"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 bg-[#0f294a] hover:bg-[#163b69] text-white font-medium rounded-md transition-colors shadow-xs mt-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};
