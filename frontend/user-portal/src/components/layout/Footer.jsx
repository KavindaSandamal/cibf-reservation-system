// ==================== src/components/layout/Footer.jsx ====================
import { Container, Row, Col } from 'react-bootstrap';
import { IoLocation } from "react-icons/io5";
import { MdEmail } from "react-icons/md";


import { Link } from 'react-router-dom';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-light border-top mt-auto py-4">
      <Container>
        <Row>
          <Col md={4} className="mb-3 mb-md-0">
            <h5 className="text-primary mb-3">📚 Colombo Bookfair</h5>
            <p className="text-secondary small">
              Your premier destination for literary events and book stall reservations. 
              Connecting readers, vendors, and book lovers since 2024.
            </p>
          </Col>
          
          <Col md={2} className="mb-3 mb-md-0">
            <h6 className="text-dark mb-3">Quick Links</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/" className="text-secondary text-decoration-none small hover-link">
                  Home
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/stalls" className="text-secondary text-decoration-none small hover-link">
                  Book Stalls
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/genres" className="text-secondary text-decoration-none small hover-link">
                  Genres
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/reservations" className="text-secondary text-decoration-none small hover-link">
                  Reservations
                </Link>
              </li>
            </ul>
          </Col>
          
          <Col md={3} className="mb-3 mb-md-0">
            <h6 className="text-dark mb-3">Support</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <a href="#" className="text-secondary text-decoration-none small hover-link">
                  Help Center
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-secondary text-decoration-none small hover-link">
                  Contact Us
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-secondary text-decoration-none small hover-link">
                  Terms of Service
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-secondary text-decoration-none small hover-link">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </Col>
          
          <Col md={3}>
            <h6 className="text-dark mb-3">Connect With Us</h6>
            <div className="d-flex gap-3">
              <a href="#" className="text-primary" aria-label="Facebook">
                <i className="bi bi-facebook fs-5"></i>
              </a>
              <a href="#" className="text-info" aria-label="Twitter">
                <i className="bi bi-twitter fs-5"></i>
              </a>
              <a href="#" className="text-danger" aria-label="Instagram">
                <i className="bi bi-instagram fs-5"></i>
              </a>
              <a href="#" className="text-primary" aria-label="LinkedIn">
                <i className="bi bi-linkedin fs-5"></i>
              </a>
            </div>
            <p className="text-secondary small mt-3 mb-0">
              <IoLocation /> Colombo, Western Province, LK
            </p>
            <p className="text-secondary small mb-0">
             <MdEmail /> info@colombobookfair.lk
            </p>
          </Col>
        </Row>
        
        <hr className="my-4" />
        
        <Row>
          <Col className="text-center">
            <p className="text-secondary small mb-0">
              © {currentYear} Colombo Bookfair. All rights reserved.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}

export default Footer;