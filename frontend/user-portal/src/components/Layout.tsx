import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Check if we're on the dashboard, reservations, stalls, book, or QR code page to apply dark theme
  const isDarkPage = location.pathname === '/dashboard' || 
                     location.pathname === '/reservations' || 
                     location.pathname === '/stalls' || 
                     location.pathname === '/book' ||
                     location.pathname.startsWith('/qr/') ||
                     location.pathname.startsWith('/reservations/');

  return (
    <div className={isDarkPage ? 'min-h-screen bg-slate-950' : 'min-h-screen bg-gray-50'}>
      {/* Header */}
      <header className={isDarkPage 
        ? 'bg-slate-900/80 backdrop-blur-md border-b border-slate-800 shadow-lg'
        : 'bg-white shadow-sm border-b border-gray-200'
      }>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link 
                to="/dashboard" 
                className={`text-2xl font-bold ${isDarkPage 
                  ? 'bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent'
                  : 'text-primary-600'
                }`}
              >
                CIBF Reservation
              </Link>
              <nav className="hidden md:flex space-x-4">
                <Link
                  to="/dashboard"
                  className={isDarkPage
                    ? 'text-slate-300 hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium transition-colors'
                    : 'text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium'
                  }
                >
                  Dashboard
                </Link>
                <Link
                  to="/stalls"
                  className={isDarkPage
                    ? 'text-slate-300 hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium transition-colors'
                    : 'text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium'
                  }
                >
                  Browse Stalls
                </Link>
                <Link
                  to="/reservations"
                  className={isDarkPage
                    ? 'text-slate-300 hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium transition-colors'
                    : 'text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium'
                  }
                >
                  My Reservations
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`text-sm ${isDarkPage ? 'text-slate-300' : 'text-gray-700'}`}>
                {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={handleLogout}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isDarkPage
                    ? 'bg-red-600/80 hover:bg-red-600 text-white border border-red-500/50'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content - no padding/margin for dark pages to allow full control */}
      {isDarkPage ? (
        <main>
          {children}
        </main>
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      )}
    </div>
  );
};

export default Layout;


