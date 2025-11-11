// ==================== 7. src/components/common/LoadingSpinner.jsx ====================
import { Spinner, Container } from 'react-bootstrap';

function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <Container className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
      <Spinner animation="border" role="status" variant="primary">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      <p className="mt-3 text-muted">{message}</p>
    </Container>
  );
}

export default LoadingSpinner;


