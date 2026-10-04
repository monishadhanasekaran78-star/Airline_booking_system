import React, { useState, useEffect } from 'react';
import { Flight, Booking, Aircraft } from '../types';
import { formatINR, formatISTDate, formatISTTime, INDIAN_AIRPORTS } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Edit3, Plane, Users, CheckCircle, RefreshCw } from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const { token } = useAuth();
  const [activeAdminTab, setActiveAdminTab] = useState<'flights' | 'bookings' | 'aircraft'>('flights');

  const [flights, setFlights] = useState<Flight[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Modal for Add / Edit flight
  const [isFlightModalOpen, setIsFlightModalOpen] = useState<boolean>(false);
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [flightForm, setFlightForm] = useState({
    flight_number: '',
    aircraft_id: '1',
    origin_code: 'MAA',
    origin_city: 'Chennai',
    destination_code: 'DEL',
    destination_city: 'Delhi',
    departure_time: '2026-10-08T06:30',
    arrival_time: '2026-10-08T09:15',
    base_fare_inr: 4500,
  });

  const fetchData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [flightsRes, bookingsRes, aircraftRes] = await Promise.all([
        fetch('/api/flights'),
        fetch('/api/bookings/admin/all', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/bookings/admin/aircraft', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const flightsData = await flightsRes.json();
      const bookingsData = await bookingsRes.json();
      const aircraftData = await aircraftRes.json();

      setFlights(flightsData.flights || []);
      setBookings(bookingsData.bookings || []);
      setAircraftList(aircraftData.aircraft || []);
    } catch {
      setNotification('Failed to synchronize admin data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleOpenAddFlight = () => {
    setEditingFlight(null);
    setFlightForm({
      flight_number: `SK-${Math.floor(500 + Math.random() * 400)}`,
      aircraft_id: aircraftList[0]?.id?.toString() || '1',
      origin_code: 'MAA',
      origin_city: 'Chennai',
      destination_code: 'DEL',
      destination_city: 'Delhi',
      departure_time: '2026-10-08T06:30',
      arrival_time: '2026-10-08T09:15',
      base_fare_inr: 4500,
    });
    setIsFlightModalOpen(true);
  };

  const handleOpenEditFlight = (f: Flight) => {
    setEditingFlight(f);
    setFlightForm({
      flight_number: f.flight_number,
      aircraft_id: f.aircraft_id.toString(),
      origin_code: f.origin_code,
      origin_city: f.origin_city,
      destination_code: f.destination_code,
      destination_city: f.destination_city,
      departure_time: f.departure_time.slice(0, 16),
      arrival_time: f.arrival_time.slice(0, 16),
      base_fare_inr: f.base_fare_inr,
    });
    setIsFlightModalOpen(true);
  };

  const handleDeleteFlight = async (flightId: number) => {
    if (!confirm('Are you sure you want to delete this flight schedule and seats?')) return;
    try {
      const res = await fetch(`/api/flights/admin/${flightId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotification('Flight deleted successfully.');
        fetchData();
      } else {
        alert('Failed to delete flight.');
      }
    } catch {
      alert('Error deleting flight.');
    }
  };

  const handleSaveFlight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const originAirport = INDIAN_AIRPORTS.find(a => a.code === flightForm.origin_code);
      const destAirport = INDIAN_AIRPORTS.find(a => a.code === flightForm.destination_code);

      const payload = {
        ...flightForm,
        origin_city: originAirport ? originAirport.city : flightForm.origin_city,
        destination_city: destAirport ? destAirport.city : flightForm.destination_city,
        base_fare_inr: Number(flightForm.base_fare_inr),
        aircraft_id: Number(flightForm.aircraft_id),
      };

      if (editingFlight) {
        const res = await fetch(`/api/flights/admin/${editingFlight.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setNotification('Flight schedule updated successfully.');
          setIsFlightModalOpen(false);
          fetchData();
        } else {
          const err = await res.json();
          alert(err.error || 'Failed to update flight.');
        }
      } else {
        const res = await fetch('/api/flights/admin/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setNotification('Flight schedule added with 24 generated seats.');
          setIsFlightModalOpen(false);
          fetchData();
        } else {
          const err = await res.json();
          alert(err.error || 'Failed to create flight.');
        }
      }
    } catch {
      alert('Network error saving flight.');
    }
  };

  // Metrics
  const totalRevenue = bookings
    .filter(b => b.booking_status === 'CONFIRMED')
    .reduce((sum, b) => sum + b.total_amount_inr, 0);

  const totalRefunded = bookings
    .filter(b => b.booking_status === 'CANCELLED' && b.refund)
    .reduce((sum, b) => sum + (b.refund?.refund_amount_inr || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Administrator Console</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-xs">
              System Admin
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage flight schedules, 24-seat aircraft configurations, and view customer bookings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh database records"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenAddFlight}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#e65100] hover:bg-[#cf4700] text-white text-xs font-semibold rounded-md transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Flight Schedule</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs text-emerald-700 font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Flights</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{flights.length}</div>
          <span className="text-[10px] text-slate-400">Domestic routes</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Confirmed Bookings</span>
          <div className="text-2xl font-bold text-[#0f294a] mt-1">
            {bookings.filter(b => b.booking_status === 'CONFIRMED').length}
          </div>
          <span className="text-[10px] text-slate-400">Total tickets issued</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Net Revenue (₹)</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{formatINR(totalRevenue)}</div>
          <span className="text-[10px] text-slate-400">Indian domestic bookings</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Refunds Processed</span>
          <div className="text-2xl font-bold text-rose-700 mt-1">{formatINR(totalRefunded)}</div>
          <span className="text-[10px] text-slate-400">80% automatic rate</span>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-md">
        <button
          onClick={() => setActiveAdminTab('flights')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
            activeAdminTab === 'flights'
              ? 'border-[#0f294a] text-[#0f294a]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Flight Schedules ({flights.length})
        </button>
        <button
          onClick={() => setActiveAdminTab('bookings')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
            activeAdminTab === 'bookings'
              ? 'border-[#0f294a] text-[#0f294a]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          All Customer Bookings ({bookings.length})
        </button>
        <button
          onClick={() => setActiveAdminTab('aircraft')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
            activeAdminTab === 'aircraft'
              ? 'border-[#0f294a] text-[#0f294a]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Aircraft Fleet ({aircraftList.length})
        </button>
      </div>

      {/* Tab 1: Flights Table */}
      {activeAdminTab === 'flights' && (
        <div className="bg-white border border-slate-200 rounded-b-md shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Flight</th>
                  <th className="py-3 px-4">Aircraft</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Departure (IST)</th>
                  <th className="py-3 px-4">Arrival (IST)</th>
                  <th className="py-3 px-4 text-right">Base Fare (₹)</th>
                  <th className="py-3 px-4">Seats Left</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {flights.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{f.flight_number}</td>
                    <td className="py-3 px-4 text-slate-600">{f.aircraft_model || 'Airbus A320'}</td>
                    <td className="py-3 px-4 font-medium">
                      {f.origin_code} ({f.origin_city}) &rarr; {f.destination_code} ({f.destination_city})
                    </td>
                    <td className="py-3 px-4">
                      <div>{formatISTTime(f.departure_time)}</div>
                      <div className="text-[10px] text-slate-400">{formatISTDate(f.departure_time)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{formatISTTime(f.arrival_time)}</div>
                      <div className="text-[10px] text-slate-400">{formatISTDate(f.arrival_time)}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#0f294a]">
                      {formatINR(f.base_fare_inr)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-700">
                        {f.available_seats ?? 24} / 24
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditFlight(f)}
                          className="p-1 text-slate-600 hover:text-[#0f294a] rounded-sm transition-colors"
                          title="Edit flight"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteFlight(f.id)}
                          className="p-1 text-rose-600 hover:text-rose-800 rounded-sm transition-colors"
                          title="Delete flight"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: All Bookings Table */}
      {activeAdminTab === 'bookings' && (
        <div className="bg-white border border-slate-200 rounded-b-md shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">PNR</th>
                  <th className="py-3 px-4">Customer Account</th>
                  <th className="py-3 px-4">Flight</th>
                  <th className="py-3 px-4">Passenger</th>
                  <th className="py-3 px-4">Seat</th>
                  <th className="py-3 px-4 text-right">Fare Paid</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Txn ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#0f294a]">{b.pnr}</td>
                    <td className="py-3 px-4 text-slate-600">{b.user_email || 'Customer'}</td>
                    <td className="py-3 px-4 font-medium">{b.flight?.flight_number || 'SK Flight'}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{b.passenger_name}</div>
                      <div className="text-[10px] text-slate-400">{b.passenger_phone}</div>
                    </td>
                    <td className="py-3 px-4 font-bold">{b.seat_number}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatINR(b.total_amount_inr)}
                    </td>
                    <td className="py-3 px-4">
                      {b.booking_status === 'CONFIRMED' ? (
                        <span className="px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Confirmed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                          Cancelled (80% Refunded: {formatINR(b.refund?.refund_amount_inr || 0)})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {b.payment?.transaction_id || '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Aircraft Fleet Table */}
      {activeAdminTab === 'aircraft' && (
        <div className="bg-white border border-slate-200 rounded-b-md shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Configured Aircraft Fleet</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Each aircraft supports 24 seats (Rows 1-4, Cols A-F: Row 1 Premium Economy, Rows 2-4 Economy).
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Aircraft ID</th>
                  <th className="py-3 px-4">Model</th>
                  <th className="py-3 px-4">DGCA Registration</th>
                  <th className="py-3 px-4">Seat Capacity</th>
                  <th className="py-3 px-4">Layout Spec</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {aircraftList.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{a.id}</td>
                    <td className="py-3 px-4 font-semibold text-[#0f294a]">{a.model}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{a.registration_number}</td>
                    <td className="py-3 px-4 font-bold">{a.total_seats} seats</td>
                    <td className="py-3 px-4 text-slate-500">4 Rows x 6 Columns (3-3 aisle: A B C | D E F)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Flight Modal */}
      {isFlightModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-md border border-slate-200 max-w-lg w-full p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingFlight ? 'Edit Flight Schedule' : 'Add New Domestic Flight'}
              </h3>
              <button
                onClick={() => setIsFlightModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveFlight} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Flight Number</label>
                  <input
                    type="text"
                    required
                    value={flightForm.flight_number}
                    onChange={(e) => setFlightForm({ ...flightForm, flight_number: e.target.value.toUpperCase() })}
                    placeholder="e.g. SK-501"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md uppercase font-bold text-slate-900 focus:outline-hidden focus:border-[#0f294a]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Aircraft</label>
                  <select
                    value={flightForm.aircraft_id}
                    onChange={(e) => setFlightForm({ ...flightForm, aircraft_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:border-[#0f294a] bg-white cursor-pointer"
                  >
                    {aircraftList.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.model} ({a.registration_number})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Origin Airport</label>
                  <select
                    value={flightForm.origin_code}
                    onChange={(e) => setFlightForm({ ...flightForm, origin_code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:border-[#0f294a] bg-white cursor-pointer"
                  >
                    {INDIAN_AIRPORTS.map((a) => (
                      <option key={a.code} value={a.code}>
                        {a.city} ({a.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Destination Airport</label>
                  <select
                    value={flightForm.destination_code}
                    onChange={(e) => setFlightForm({ ...flightForm, destination_code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:border-[#0f294a] bg-white cursor-pointer"
                  >
                    {INDIAN_AIRPORTS.map((a) => (
                      <option key={a.code} value={a.code}>
                        {a.city} ({a.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Departure (IST)</label>
                  <input
                    type="datetime-local"
                    required
                    value={flightForm.departure_time}
                    onChange={(e) => setFlightForm({ ...flightForm, departure_time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:border-[#0f294a]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Arrival (IST)</label>
                  <input
                    type="datetime-local"
                    required
                    value={flightForm.arrival_time}
                    onChange={(e) => setFlightForm({ ...flightForm, arrival_time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:border-[#0f294a]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Base Economy Fare in Indian Rupees (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 font-bold text-slate-500">₹</span>
                  <input
                    type="number"
                    min="1000"
                    max="50000"
                    step="100"
                    required
                    value={flightForm.base_fare_inr}
                    onChange={(e) => setFlightForm({ ...flightForm, base_fare_inr: Number(e.target.value) })}
                    className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-md font-bold text-slate-900 focus:outline-hidden focus:border-[#0f294a]"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Row 1 Premium Economy seats will automatically be priced at Base Fare + ₹800.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFlightModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0f294a] hover:bg-[#163b69] text-white font-medium rounded-md transition-colors shadow-xs"
                >
                  {editingFlight ? 'Update Flight' : 'Create Flight & Generate 24 Seats'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
