import React, { useState } from 'react';
import { Navbar as BSNavbar, Nav, Container, Button, NavDropdown, Badge } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  BookOpen, 
  LayoutDashboard, 
  Calendar, 
  User, 
  LogOut, 
  Store,
  BookMarked,
  Menu,
  X
} from 'lucide-react';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = () => {
    logout();
    toast.info('Logged out successfully');
    navigate('/login');
    setExpanded(false);
  };

  const getRoleBadge = (role) => {
    const badges = {
      'ADMIN': { color: 'danger', label: 'Admin' },
      'EMPLOYEE': { color: 'warning', label: 'Employee' },
      'VENDOR': { color: 'success', label: 'Vendor' }
    };
    return badges[role] || { color: 'secondary', label: role };
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const handleNavClick = () => {
    setExpanded(false);
  };

  return (
    <>
      <BSNavbar 
        expand="lg" 
        className="shadow-lg sticky-top"
        expanded={expanded}
        onToggle={setExpanded}
        style={{ 
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderBottom: '3px solid rgba(255,255,255,0.1)'
        }}
      >
        <Container>
          {/* Brand */}
          <BSNavbar.Brand 
            as={Link} 
            to="/" 
            className="d-flex align-items-center"
            onClick={handleNavClick}
            style={{ fontWeight: 700, fontSize: '1.25rem', color: '#ffffff' }}
          >
            <BookOpen size={28} className="me-2" style={{ color: '#ffffff' }} />
            <span className="d-none d-sm-inline">Colombo Book Fair Reserve Hub</span>
            <span className="d-inline d-sm-none">CBF</span>
          </BSNavbar.Brand>

          {/* Toggle Button */}
          <BSNavbar.Toggle 
            aria-controls="basic-navbar-nav"
            style={{ border: 'none', padding: '0.5rem', color: '#ffffff' }}
          >
            {expanded ? <X size={24} color="#ffffff" /> : <Menu size={24} color="#ffffff" />}
          </BSNavbar.Toggle>

          <BSNavbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-lg-center">
              {user ? (
                <>
                  {/* Dashboard Link */}
                  <Nav.Link 
                    as={Link} 
                    to="/dashboard"
                    onClick={handleNavClick}
                    className={`d-flex align-items-center px-3 py-2 nav-link-custom ${isActivePath('/dashboard') ? 'active-link' : ''}`}
                  >
                    <LayoutDashboard size={18} className="me-2" />
                    Dashboard
                  </Nav.Link>

                  {/* Book Stalls Link */}
                  <Nav.Link 
                    as={Link} 
                    to="/stalls"
                    onClick={handleNavClick}
                    className={`d-flex align-items-center px-3 py-2 nav-link-custom ${isActivePath('/stalls') ? 'active-link' : ''}`}
                  >
                    <Store size={18} className="me-2" />
                    Book Stalls
                  </Nav.Link>

                  {/* My Reservations Link */}
                  <Nav.Link 
                    as={Link} 
                    to="/reservations"
                    onClick={handleNavClick}
                    className={`d-flex align-items-center px-3 py-2 nav-link-custom ${isActivePath('/reservations') ? 'active-link' : ''}`}
                  >
                    <Calendar size={18} className="me-2" />
                    My Reservations
                  </Nav.Link>

                  {/* Genres Link */}
                  <Nav.Link 
                    as={Link} 
                    to="/genres"
                    onClick={handleNavClick}
                    className={`d-flex align-items-center px-3 py-2 nav-link-custom ${isActivePath('/genres') ? 'active-link' : ''}`}
                  >
                    <BookMarked size={18} className="me-2" />
                    Literary Genres
                  </Nav.Link>

                  {/* User Dropdown */}
                  <NavDropdown
                    title={
                      <span className="d-flex align-items-center">
                        <div className="user-avatar me-2">
                          <User size={16} />
                        </div>
                        <span className="d-none d-lg-inline me-1">
                          {user.businessName || user.username}
                        </span>
                        <Badge 
                          bg={getRoleBadge(user.role).color} 
                          className="ms-1"
                          style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                        >
                          {getRoleBadge(user.role).label}
                        </Badge>
                      </span>
                    }
                    id="user-dropdown"
                    className="ms-lg-2 user-dropdown"
                    align="end"
                  >
                    {/* Profile Info Header */}
                    <div className="px-3 py-2 border-bottom">
                      <div className="small text-muted">Signed in as</div>
                      <div className="fw-bold">{user.email}</div>
                    </div>

                      
                    <NavDropdown.Item 
                      onClick={handleLogout}
                      className="d-flex align-items-center py-2 text-danger"
                    >
                      <LogOut size={16} className="me-2" />
                      Logout
                    </NavDropdown.Item>
                  </NavDropdown>
                </>
              ) : (
                <>
                  <Nav.Link 
                    as={Link} 
                    to="/login"
                    onClick={handleNavClick}
                    className="px-3 py-2"
                    style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}
                  >
                    Login
                  </Nav.Link>
                  <Button
                    variant="light"
                    size="sm"
                    as={Link}
                    to="/register"
                    onClick={handleNavClick}
                    className="ms-lg-2 mt-2 mt-lg-0 btn-register"
                    style={{ 
                      padding: '0.5rem 1.25rem',
                      fontWeight: 600,
                      borderRadius: '0.5rem',
                      backgroundColor: '#ffffff',
                      color: '#4c51bf',
                      border: 'none'
                    }}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </Nav>
          </BSNavbar.Collapse>
        </Container>
      </BSNavbar>

      <style>{`
        .nav-link-custom {
          font-weight: 500;
          color: rgba(255, 255, 255, 0.9) !important;
          transition: all 0.2s ease;
          border-radius: 0.5rem;
          margin: 0.25rem 0;
        }

        .nav-link-custom:hover {
          color: #ffffff !important;
          background-color: rgba(255, 255, 255, 0.15);
        }

        .active-link {
          color: #ffffff !important;
          background-color: rgba(255, 255, 255, 0.25);
          font-weight: 600;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .user-dropdown .dropdown-toggle {
          background: transparent;
          border: none;
          color: #ffffff !important;
          font-weight: 500;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          transition: all 0.2s ease;
        }

        .user-dropdown .dropdown-toggle:hover {
          background-color: rgba(255, 255, 255, 0.15);
        }

        .user-dropdown .dropdown-toggle::after {
          margin-left: 0.5rem;
        }

        .dropdown-menu {
          border: 1px solid #e5e7eb;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border-radius: 0.75rem;
          padding: 0.5rem;
          min-width: 240px;
        }

        .dropdown-item {
          border-radius: 0.5rem;
          padding: 0.5rem 1rem;
          transition: all 0.2s ease;
        }

        .dropdown-item:hover {
          background-color: #f1f5f9;
        }

        .dropdown-item.text-danger:hover {
          background-color: #fef2f2;
          color: #dc2626 !important;
        }

        @media (max-width: 991.98px) {
          .nav-link-custom {
            padding: 0.75rem 1rem !important;
          }

          .user-dropdown {
            margin-top: 0.5rem;
          }

          .dropdown-menu {
            border: none;
            box-shadow: none;
            padding: 0;
          }
        }

        .navbar-toggler:focus {
          box-shadow: none;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-register:hover {
          background-color: #f8f9fa !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
        }

        @media (max-width: 991.98px) {
          .navbar-collapse {
            background: linear-gradient(135deg, #4c51bf 0%, #5b21b6 100%);
            padding: 1rem;
            border-radius: 0.5rem;
            margin-top: 1rem;
          }
        }
      `}</style>
    </>
  );
}

export default Navbar;