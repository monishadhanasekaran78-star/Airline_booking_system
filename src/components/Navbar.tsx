import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Plane, User as UserIcon, LogOut, Shield } from 'lucide-react';

interface NavbarProps {
  activeTab: 'search' | 'my-bookings' | 'admin';
  setActiveTab: (tab: 'search' | 'my-bookings' | 'admin') => void;
  openAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, openAuthModal }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('search')}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <div className="w-8 h-8 rounded-md bg-[#0f294a] flex items-center justify-center text-white">
            <Plane className="w-5 h-5 rotate-45" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-[#0f294a]">SkyBook</span>
            <span className="text-[10px] text-slate-500 font-medium -mt-1 tracking-wider uppercase">Indian Airlines</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'search'
                ? 'bg-slate-100 text-[#0f294a]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Search Flights
          </button>

          <button
            onClick={() => {
              if (!user) {
                openAuthModal();
              } else {
                setActiveTab('my-bookings');
              }
            }}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'my-bookings'
                ? 'bg-slate-100 text-[#0f294a]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            My Bookings
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-slate-100 text-[#0f294a]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Admin Portal</span>
            </button>
          )}
        </nav>

        {/* User Account Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-800 leading-none">{user.name}</span>
                <span className="text-[11px] text-slate-500 capitalize">{user.role}</span>
              </div>
              <button
                onClick={logout}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-white bg-[#0f294a] hover:bg-[#163b69] rounded-md transition-colors shadow-xs"
            >
              <UserIcon className="w-4 h-4" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
