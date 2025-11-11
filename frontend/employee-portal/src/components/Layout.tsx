import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEmployeeAuth } from '../contexts/EmployeeAuthContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { employee, logout } = useEmployeeAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/employee/login');
  };

  // Check if we're on a dark-themed page (dashboard, reservations, users, stalls)
  const isDarkPage = ['/employee/dashboard', '/employee/reservations', '/employee/users', '/employee/stalls'].includes(location.pathname);

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
                to="/employee/dashboard"
                className={`text-2xl font-bold ${isDarkPage
                  ? 'bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent'
                  : 'text-primary-600'
                }`}
              >
                CIBF Employee Portal
              </Link>
              <nav className="hidden md:flex space-x-4">
                <Link
                  to="/employee/dashboard"
                  className={isDarkPage
                    ? 'text-slate-300 hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium transition-colors'
                    : 'text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium'
                  }
                >
                  Dashboard
                </Link>
                <Link
                  to="/employee/reservations"
                  className={isDarkPage
                    ? 'text-slate-300 hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium transition-colors'
                    : 'text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium'
                  }
                >
                  Reservations
                </Link>
                <Link
                  to="/employee/users"
                  className={isDarkPage
                    ? 'text-slate-300 hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium transition-colors'
                    : 'text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium'
                  }
                >
                  Users
                </Link>
                <Link
                  to="/employee/stalls"
                  className={isDarkPage
                    ? 'text-slate-300 hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium transition-colors'
                    : 'text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium'
                  }
                >
                  Stalls
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`text-sm ${isDarkPage ? 'text-slate-300' : 'text-gray-700'}`}>
                {employee?.name || 'Employee'}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${isDarkPage 
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                : 'bg-primary-100 text-primary-700'
              }`}>
                {employee?.role || 'EMPLOYEE'}
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

