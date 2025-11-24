// ==================== 5. src/components/dashboard/Dashboard.jsx ====================
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Dashboard() {
  const { user } = useAuth();

  return (
    <Container className="mt-4">
      <Row>
        <Col md={12}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">Welcome, {user?.businessName || user?.username}!</h2>
              <Badge bg="success" className="mt-1">{user?.role}</Badge>
            </div>
          </div>
        </Col>
      </Row>

      <Row className="g-4">
        <Col md={4}>
          <Card className="h-100 shadow-sm hover-shadow">
            <Card.Body className="text-center">
              <div className="mb-3" style={{ fontSize: '3rem' }}>🏪</div>
              <Card.Title>Book a Stall</Card.Title>
              <Card.Text>
                Browse available stalls and make your reservation for the bookfair.
              </Card.Text>
              <Button variant="primary" as={Link} to="/stalls">
                View Stalls
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="h-100 shadow-sm hover-shadow">
            <Card.Body className="text-center">
              <div className="mb-3" style={{ fontSize: '3rem' }}>📋</div>
              <Card.Title>My Reservations</Card.Title>
              <Card.Text>
                View and manage your stall reservations and download QR codes.
              </Card.Text>
              <Button variant="primary" as={Link} to="/reservations">
                View Reservations
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="h-100 shadow-sm hover-shadow">
            <Card.Body className="text-center">
              <div className="mb-3" style={{ fontSize: '3rem' }}>📚</div>
              <Card.Title>Literary Genres</Card.Title>
              <Card.Text>
                Select your preferred literary genres to customize your experience.
              </Card.Text>
              <Button variant="primary" as={Link} to="/genres">
                Manage Genres
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-5">
        <Col md={12}>
          <Card className="bg-light">
            <Card.Body>
              <h4 className="mb-3">📢 Important Information</h4>
              <ul className="mb-0">
                <li>Each business can reserve a maximum of 3 stalls</li>
                <li>Reservations must be confirmed within 24 hours</li>
                <li>QR codes will be sent via email after confirmation</li>
                <li>Bring your QR code on the event day for entry</li>
                <li>Contact support if you need to modify your reservation</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={12}>
          <Card className="border-primary">
            <Card.Body>
              <h5 className="text-primary mb-3">📊 Quick Stats</h5>
              <Row className="text-center">
                <Col md={3}>
                  <h3 className="text-primary">0</h3>
                  <p className="text-muted mb-0">Active Reservations</p>
                </Col>
                <Col md={3}>
                  <h3 className="text-success">3</h3>
                  <p className="text-muted mb-0">Available Slots</p>
                </Col>
                <Col md={3}>
                  <h3 className="text-info">0</h3>
                  <p className="text-muted mb-0">Selected Genres</p>
                </Col>
                <Col md={3}>
                  <h3 className="text-warning">New</h3>
                  <p className="text-muted mb-0">Account Status</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Dashboard;
