// ==================== 2. src/components/auth/Register.jsx ====================
import { useState } from 'react';
import { Form, Button, Spinner, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Eye, EyeOff, BookOpen} from 'lucide-react';
import HeroSection from '../layout/rightComponent';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    contactNumber: '',
    address: ''
  });
  const [validated, setValidated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Add state for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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

    const { confirmPassword, ...registrationData } = formData;
    registrationData.role = 'VENDOR';
    
    console.log("Registration Payload:", registrationData);
    
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
    <div className="min-h-screen flex relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full lg:w-1/2 flex items-start justify-center pt-12 px-8 bg-transparent relative z-10">
        <div className="w-full max-w-md">
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-blue-600 text-sm font-medium mb-2 flex items-center gap-2">
              Start your journey
            </p>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Your Account</h1>
            <p className="text-gray-600">Fill in your details to get started.</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 text-sm flex items-start gap-3 animate-slide-down">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>{error}</div>
            </div>
          )}
          
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label className="block text-sm font-semibold text-gray-700 mb-2">Username *</Form.Label>
                  <Form.Control
                    required
                    type="email"
                    name="username"
                    placeholder="example@gmail.com"
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
                  <Form.Label className="block text-sm font-semibold text-gray-700 mb-2">Password *</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      required
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      minLength="6"
                      value={formData.password}
                      onChange={handleChange}
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent pe-3"
                      style={{ cursor: 'pointer', zIndex: 10 }}
                    >
                      {showPassword ? (
                        <EyeOff className="text-gray-500" size={20} />
                      ) : (
                        <Eye className="text-gray-500" size={20} />
                      )}
                    </button>
                  </div>
                  <Form.Control.Feedback type="invalid">
                    Password must be at least 6 characters.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password *</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      required
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm password"
                      minLength="6"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent pe-3"
                      style={{ cursor: 'pointer', zIndex: 10 }}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="text-gray-500" size={20} />
                      ) : (
                        <Eye className="text-gray-500" size={20} />
                      )}
                    </button>
                  </div>
                  <Form.Control.Feedback type="invalid">
                    Please confirm your password.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label className="block text-sm font-semibold text-gray-700 mb-2">Business Name *</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    name="businessName"
                    placeholder="ABC Publishers"
                    value={formData.businessName}
                    onChange={handleChange}
                  />
                  <Form.Control.Feedback type="invalid">
                    Business name is required.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}> 
                <Form.Group className="mb-3">
                  <Form.Label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number *</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    name="contactNumber"
                    placeholder="+94712345678"
                    value={formData.contactNumber}
                    onChange={handleChange}
                  />
                  <Form.Control.Feedback type="invalid">
                    Contact Number is required.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="block text-sm font-semibold text-gray-700 mb-2">Address *</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    name="address"
                    placeholder="Local address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                  <Form.Control.Feedback type="invalid">
                    Address is required.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 mb-3 from-blue-600 to-blue-700"
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
        </div>
      </div>
      <HeroSection/>
    </div>
  );
}

export default Register;