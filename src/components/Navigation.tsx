import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User as UserIcon, Home, Plane as Plant, MessageSquare } from 'lucide-react';
import useAuthStore from '../store/authStore';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-green-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Plant className="h-8 w-8" />
              <span className="font-bold text-xl">Garden Planner</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              <Link to="/" className="hover:bg-green-700 px-3 py-2 rounded-md">
                <Home className="inline-block mr-1 h-5 w-5" />
                Home
              </Link>
              {isAuthenticated && (
                <Link to="/dashboard" className="hover:bg-green-700 px-3 py-2 rounded-md">
                  <Plant className="inline-block mr-1 h-5 w-5" />
                  Dashboard
                </Link>
              )}
              <Link to="/contact" className="hover:bg-green-700 px-3 py-2 rounded-md">
                <MessageSquare className="inline-block mr-1 h-5 w-5" />
                Contact
              </Link>
              {isAuthenticated ? (
                <>
                  {user?.is_admin && (
                    <Link to="/admin" className="hover:bg-green-700 px-3 py-2 rounded-md">
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="hover:bg-green-700 px-3 py-2 rounded-md flex items-center"
                  >
                    <LogOut className="mr-1 h-5 w-5" />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="hover:bg-green-700 px-3 py-2 rounded-md flex items-center"
                >
                  <UserIcon className="mr-1 h-5 w-5" />
                  Login
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-green-700"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="fixed inset-0 z-50 bg-green-600 transform transition-transform duration-300">
          <div className="flex justify-end p-4">
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-md hover:bg-green-700 p-2"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className="block px-3 py-2 rounded-md hover:bg-green-700"
              onClick={() => setIsOpen(false)}
            >
              <Home className="inline-block mr-2 h-5 w-5" />
              Home
            </Link>
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className="block px-3 py-2 rounded-md hover:bg-green-700"
                onClick={() => setIsOpen(false)}
              >
                <Plant className="inline-block mr-2 h-5 w-5" />
                Dashboard
              </Link>
            )}
            <Link
              to="/contact"
              className="block px-3 py-2 rounded-md hover:bg-green-700"
              onClick={() => setIsOpen(false)}
            >
              <MessageSquare className="inline-block mr-2 h-5 w-5" />
              Contact
            </Link>
            {isAuthenticated ? (
              <>
                {user?.is_admin && (
                  <Link
                    to="/admin"
                    className="block px-3 py-2 rounded-md hover:bg-green-700"
                    onClick={() => setIsOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md hover:bg-green-700"
                >
                  <LogOut className="inline-block mr-2 h-5 w-5" />
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="block px-3 py-2 rounded-md hover:bg-green-700"
                onClick={() => setIsOpen(false)}
              >
                <UserIcon className="inline-block mr-2 h-5 w-5" />
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
