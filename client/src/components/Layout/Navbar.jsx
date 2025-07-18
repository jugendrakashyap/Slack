import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import NotificationDropdown from '../Notifications/NotificationDropdown';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="text-2xl font-bold text-blue-600 hover:text-blue-700"
            onClick={closeMenu}
          >
            StackIt
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-blue-600 font-medium"
            >
              Questions
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link 
                  to="/ask" 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Ask Question
                </Link>
                
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-gray-700 hover:text-blue-600"
                  >
                    <Bell size={20} />
                    {/* Notification badge will be added here */}
                  </button>
                  {showNotifications && (
                    <NotificationDropdown 
                      onClose={() => setShowNotifications(false)} 
                    />
                  )}
                </div>

                {/* User Menu */}
                <div className="flex items-center space-x-3">
                  <Link 
                    to={`/profile/${user?.id}`}
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600"
                  >
                    <User size={20} />
                    <span className="font-medium">{user?.username}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-gray-700 hover:text-red-600"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-blue-600 font-medium"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-blue-600"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-3">
              <Link 
                to="/" 
                className="text-gray-700 hover:text-blue-600 font-medium py-2"
                onClick={closeMenu}
              >
                Questions
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/ask" 
                    className="text-gray-700 hover:text-blue-600 font-medium py-2"
                    onClick={closeMenu}
                  >
                    Ask Question
                  </Link>
                  <Link 
                    to={`/profile/${user?.id}`}
                    className="text-gray-700 hover:text-blue-600 font-medium py-2"
                    onClick={closeMenu}
                  >
                    Profile ({user?.username})
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-left text-gray-700 hover:text-red-600 font-medium py-2"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-gray-700 hover:text-blue-600 font-medium py-2"
                    onClick={closeMenu}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="text-gray-700 hover:text-blue-600 font-medium py-2"
                    onClick={closeMenu}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
