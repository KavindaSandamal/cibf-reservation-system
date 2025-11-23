import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import reservationApi from '../../services/reservationApi';
import LoadingSpinner from '../common/LoadingSpinner';

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeReservations: 0,
    availableSlots: 3,
    selectedGenres: 0
  });
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  if (user?.id) fetchDashboardStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [user?.id]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      // Fetch user's reservations
      const response = await reservationApi.get(`/api/reservations/user/${user.id}`);
      const activeReservations = response.data?.filter(r => r.status === 'CONFIRMED').length || 0;
      const availableSlots = Math.max(0, 3 - activeReservations);
      
      setStats({
        activeReservations,
        availableSlots,
        selectedGenres: 0 // Update this when you have genres API
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', paddingBottom: '4rem' }}>
      <Container className="py-4">
        {/* Welcome Header */}
        <Row className="mb-4">
          <Col md={12}>
            <Card className="border-0 shadow-sm" style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}>
              <Card.Body className="py-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap">
                  <div>
                    <h2 className="mb-2 fw-bold">Welcome back, {user?.businessName || user?.username}! 👋</h2>
                    <p className="mb-2 opacity-75">Manage your stall reservations for Colombo International Book Fair</p>
                    <Badge bg="light" text="dark" className="px-3 py-2">
                      <i className="bi bi-person-badge me-1"></i>
                      {user?.role}
                    </Badge>
                  </div>
                  <div className="mt-3 mt-md-0">
                    <div className="text-center bg-white bg-opacity-10 rounded p-3 backdrop-blur">
                      <h4 className="mb-0 fw-bold">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</h4>
                      <small className="opacity-75">Today's Date</small>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Quick Stats */}
        <Row className="mb-4">
          <Col md={12}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="py-4">
                <div className="d-flex align-items-center mb-3">
                  <div style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>📊</div>
                  <h5 className="mb-0 fw-bold">Quick Stats</h5>
                </div>
                {loading ? (
                  <LoadingSpinner message='Loading Gnres...'/>
                ) : (
                  <Row className="text-center g-3">
                    <Col xs={6} md={3}>
                      <div className="p-3 bg-light rounded">
                        <div style={{ fontSize: '2rem', color: '#667eea' }} className="mb-2">
                          {stats.activeReservations}
                        </div>
                        <p className="text-muted mb-0 small fw-semibold">Active Reservations</p>
                      </div>
                    </Col>
                    <Col xs={6} md={3}>
                      <div className="p-3 bg-light rounded">
                        <div style={{ fontSize: '2rem', color: '#10b981' }} className="mb-2">
                          {stats.availableSlots}
                        </div>
                        <p className="text-muted mb-0 small fw-semibold">Available Slots</p>
                      </div>
                    </Col>
                    <Col xs={6} md={3}>
                      <div className="p-3 bg-light rounded">
                        <div style={{ fontSize: '2rem', color: '#3b82f6' }} className="mb-2">
                          {stats.selectedGenres}
                        </div>
                        <p className="text-muted mb-0 small fw-semibold">Selected Genres</p>
                      </div>
                    </Col>
                    <Col xs={6} md={3}>
                      <div className="p-3 bg-light rounded">
                        <div style={{ fontSize: '1.5rem', color: '#f59e0b' }} className="mb-2">
                          ✨ New
                        </div>
                        <p className="text-muted mb-0 small fw-semibold">Account Status</p>
                      </div>
                    </Col>
                  </Row>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Main Action Cards */}
        <Row className="g-4 mb-4">
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm hover-card" style={{ transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
              }}>
              <Card.Body className="text-center p-4">
                <div className="mb-3 p-3 bg-primary bg-opacity-10 rounded-circle d-inline-block">
                  <div style={{ fontSize: '3rem' }}>🏪</div>
                </div>
                <Card.Title className="fw-bold mb-2">Book a Stall</Card.Title>
                <Card.Text className="text-muted">
                  Browse available stalls and make your reservation for the bookfair.
                </Card.Text>
                <Button variant="primary" as={Link} to="/stalls" className="mt-2 px-4">
                  View Stalls →
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm hover-card" style={{ transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
              }}>
              <Card.Body className="text-center p-4">
                <div className="mb-3 p-3 bg-success bg-opacity-10 rounded-circle d-inline-block">
                  <div style={{ fontSize: '3rem' }}>📋</div>
                </div>
                <Card.Title className="fw-bold mb-2">My Reservations</Card.Title>
                <Card.Text className="text-muted">
                  View and manage your stall reservations and download QR codes.
                </Card.Text>
                <Button variant="success" as={Link} to="/reservations" className="mt-2 px-4">
                  View Reservations →
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm hover-card" style={{ transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
              }}>
              <Card.Body className="text-center p-4">
                <div className="mb-3 p-3 bg-info bg-opacity-10 rounded-circle d-inline-block">
                  <div style={{ fontSize: '3rem' }}>📚</div>
                </div>
                <Card.Title className="fw-bold mb-2">Literary Genres</Card.Title>
                <Card.Text className="text-muted">
                  Select your preferred literary genres to customize your experience.
                </Card.Text>
                <Button variant="info" as={Link} to="/genres" className="mt-2 px-4">
                  Manage Genres →
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Important Information */}
        <Row className="mb-5">
          <Col md={12}>
            <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #f59e0b' }}>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-3">
                  <div style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>📢</div>
                  <h5 className="mb-0 fw-bold">Important Information</h5>
                </div>
                <Row>
                  <Col md={6}>
                    <ul className="mb-0" style={{ lineHeight: '2' }}>
                      <li className="mb-2">
                        <strong>Reservation Limit:</strong> Each business can reserve a maximum of 3 stalls
                      </li>
                      <li className="mb-2">
                        <strong>Immediate Confirmation:</strong> All bookings are instantly confirmed
                      </li>
                      <li className="mb-2">
                        <strong>QR Codes:</strong> Download your QR code from the reservations page
                      </li>
                    </ul>
                  </Col>
                  <Col md={6}>
                    <ul className="mb-0" style={{ lineHeight: '2' }}>
                      <li className="mb-2">
                        <strong>Event Entry:</strong> Bring your QR code on the event day for entry
                      </li>
                      <li className="mb-2">
                        <strong>Modifications:</strong> Update your reservation details anytime
                      </li>
                      <li className="mb-2">
                        <strong>Support:</strong> Contact support for any assistance needed
                      </li>
                    </ul>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Bottom spacing before footer */}
        <div style={{ height: '3rem' }}></div>
      </Container>
    </div>
  );
}

export default Dashboard;