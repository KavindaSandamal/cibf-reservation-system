// ==================== 4. src/components/layout/Navbar.jsx ====================
import { Navbar as BSNavbar, Nav, Container, Button, NavDropdown, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.info('Logged out successfully');
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    const badges = {
      'ADMIN': 'danger',
      'EMPLOYEE': 'warning',
      'VENDOR': 'success'
    };
    return badges[role] || 'secondary';
  };

  return (
    <BSNavbar bg="primary" variant="dark" expand="lg" className="shadow-sm">
      <Container>
        <BSNavbar.Brand as={Link} to="/">
          <strong>📚 Colombo Bookfair stall Reservation System</strong>
        </BSNavbar.Brand>
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            {user ? (
              <>
                <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
                <Nav.Link as={Link} to="/stalls">Book Stalls</Nav.Link>
                <Nav.Link as={Link} to="/reservations">My Reservations</Nav.Link>
                <Nav.Link as={Link} to="/genres">Literary Genres</Nav.Link>
                
                <NavDropdown 
                  title={
                    <span>
                      {user.businessName || user.username}{' '}
                      <Badge bg={getRoleBadge(user.role)} className="ms-1">
                        {user.role}
                      </Badge>
                    </span>
                  } 
                  id="user-dropdown" 
                  className="ms-2"
                >
                  <NavDropdown.Item as={Link} to="/profile">
                    Profile
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Button 
                  variant="outline-light" 
                  size="sm" 
                  as={Link} 
                  to="/register"
                  className="ms-2"
                >
                  Register
                </Button>
              </>
            )}
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
}

export default Navbar;