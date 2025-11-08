// ==================== 2. src/components/auth/Register.jsx ====================
import { useState } from 'react';
import { Form, Button, Container, Card, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    businessName: ''
  });
  const [validated, setValidated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    
    if (form.checkValidity() === false) {
      event.stopPropagation();
      setValidated(true);
      return;
    }

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    // Remove confirmPassword and add role before sending to backend
    const { confirmPassword, ...registrationData } = formData;
    registrationData.role = 'VENDOR'; // Default role for registration
    
    const result = await register(registrationData);
    
    if (result.success) {
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } else {
      setError(result.message);
      toast.error(result.message);
    }
    
    setLoading(false);
  };

  return (
    <Container className="mt-5 mb-5">
      <Card className="mx-auto shadow" style={{ maxWidth: '600px' }}>
        <Card.Body className="p-4">
          <h2 className="text-center mb-4">Register</h2>
          <p className="text-center text-muted mb-4">
            Create your Colombo Bookfair vendor account
          </p>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Username *</Form.Label>
                  <Form.Control
                    required
                    type="email"
                    name="username"
                    placeholder="Enter your email"
                    value={formData.username}
                    onChange={handleChange}
                    
                  />
                  <Form.Control.Feedback type="invalid">
                    Please enter a valid email address.
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    This will be used to login to your account
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password *</Form.Label>
                  <Form.Control
                    required
                    type="password"
                    name="password"
                    placeholder="Password"
                    minLength="6"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <Form.Control.Feedback type="invalid">
                    Password must be at least 6 characters.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Confirm Password *</Form.Label>
                  <Form.Control
                    required
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm password"
                    minLength="6"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <Form.Control.Feedback type="invalid">
                    Please confirm your password.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Business Name *</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    name="businessName"
                    placeholder="Enter your business/publisher name"
                    value={formData.businessName}
                    onChange={handleChange}
                  />
                  <Form.Control.Feedback type="invalid">
                    Business name is required.
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Enter your publishing house or bookshop name
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 mb-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Registering...
                </>
              ) : (
                'Register'
              )}
            </Button>
          </Form>

          <div className="text-center">
            <p className="mb-0">
              Already have an account? <Link to="/login">Login here</Link>
            </p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Register;