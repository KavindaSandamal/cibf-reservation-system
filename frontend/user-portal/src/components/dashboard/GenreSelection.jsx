import { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Alert, 
  Spinner,
  Badge,
  Form
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import userApi from '../../services/userApi';
import { useAuth } from '../../context/AuthContext';

function GenreSelection() {
  const { user } = useAuth();
  const [allGenres, setAllGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGenresData();
  }, []);

  const fetchGenresData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // ✅ FIX: Added leading slash
      const allGenresResponse = await userApi.get('/api/genres');
      setAllGenres(allGenresResponse.data);
      
      // Fetch user's selected genres
      try {
        // ✅ FIX: Added leading slash
        const userGenresResponse = await userApi.get('/api/genres/user');
        const userGenreIds = userGenresResponse.data.map(genre => genre.id);
        setSelectedGenres(userGenreIds);
      } catch (err) {
        // If user hasn't selected any genres yet, start with empty array
        console.log('No genres selected yet or error:', err.response?.data);
        setSelectedGenres([]);
      }
    } catch (error) {
      console.error('Error fetching genres:', error);
      console.error('Error details:', error.response?.data);
      setError('Failed to load genres. Please try again.');
      toast.error('Failed to load genres');
    } finally {
      setLoading(false);
    }
  };

  const handleGenreToggle = (genreId) => {
    setSelectedGenres(prevSelected => {
      let newSelected;
      if (prevSelected.includes(genreId)) {
        newSelected = prevSelected.filter(id => id !== genreId);
      } else {
        newSelected = [...prevSelected, genreId];
      }
      setHasChanges(true);
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (selectedGenres.length === allGenres.length) {
      setSelectedGenres([]);
    } else {
      setSelectedGenres(allGenres.map(genre => genre.id));
    }
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (selectedGenres.length === 0) {
      toast.warning('Please select at least one genre');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // ✅ FIX: Added leading slash and simplified request body
      await userApi.post('/api/genres/user', { 
        genreIds: selectedGenres 
      });
      
      toast.success('✅ Genres saved successfully!');
      setHasChanges(false);
      
      // Refresh the data to confirm
      await fetchGenresData();
    } catch (error) {
      console.error('Error saving genres:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to save genres';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    fetchGenresData();
    setHasChanges(false);
    toast.info('Changes reset');
  };

  const isGenreSelected = (genreId) => {
    return selectedGenres.includes(genreId);
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3 text-muted">Loading genres...</p>
        </div>
      </Container>
    );
  }

  if (error && allGenres.length === 0) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Genres</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={fetchGenresData}>
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4 mb-5">
      {/* Header Section */}
      <Row className="mb-4">
        <Col md={12}>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">📚 Select Your Literary Genres</h2>
              <p className="text-muted mb-0">
                Choose genres that interest you, {user?.businessName || user?.username}
              </p>
            </div>
            <div>
              <Badge bg="primary" className="fs-6">
                {selectedGenres.length} of {allGenres.length} selected
              </Badge>
            </div>
          </div>
        </Col>
      </Row>

      {/* Info Alert */}
      <Row className="mb-4">
        <Col md={12}>
          <Alert variant="info" className="d-flex align-items-center">
            <span className="me-2">ℹ️</span>
            <div>
              <strong>Why select genres?</strong> This helps us personalize your bookfair 
              experience and recommend relevant stalls and books.
            </div>
          </Alert>
        </Col>
      </Row>

      {/* Action Buttons */}
      <Row className="mb-3">
        <Col md={12} className="d-flex justify-content-between align-items-center">
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={handleSelectAll}
          >
            {selectedGenres.length === allGenres.length ? '☐ Deselect All' : '☑ Select All'}
          </Button>
          
          {hasChanges && (
            <Badge bg="warning" text="dark">
              ⚠️ You have unsaved changes
            </Badge>
          )}
        </Col>
      </Row>

      {/* Genre Cards Grid */}
      <Row className="g-3 mb-4">
        {allGenres.map((genre) => {
          const selected = isGenreSelected(genre.id);
          
          return (
            <Col md={4} sm={6} key={genre.id}>
              <Card 
                className={`h-100 cursor-pointer transition-all ${
                  selected 
                    ? 'border-primary border-3 shadow-sm' 
                    : 'border-secondary'
                }`}
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: selected ? '#e7f3ff' : 'white'
                }}
                onClick={() => handleGenreToggle(genre.id)}
              >
                <Card.Body>
                  <div className="d-flex align-items-start justify-content-between">
                    <Form.Check
                      type="checkbox"
                      id={`genre-${genre.id}`}
                      checked={selected}
                      onChange={() => handleGenreToggle(genre.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="me-2"
                    />
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <strong className="text-dark">{genre.genreName}</strong>
                        {selected && (
                          <Badge bg="success" className="ms-2">
                            ✓ Selected
                          </Badge>
                        )}
                      </div>
                      {genre.description && (
                        <small className="text-muted d-block">
                          {genre.description}
                        </small>
                      )}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* No Genres Available */}
      {allGenres.length === 0 && (
        <Row>
          <Col md={12}>
            <Alert variant="warning" className="text-center">
              <h5>No genres available yet</h5>
              <p className="mb-0">Please check back later or contact support.</p>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Save Section */}
      <Row>
        <Col md={12}>
          <Card className="bg-light">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={8}>
                  <h5 className="mb-2">Save Your Preferences</h5>
                  <p className="text-muted mb-0">
                    {selectedGenres.length === 0 
                      ? 'Please select at least one genre to continue' 
                      : `You have selected ${selectedGenres.length} genre${selectedGenres.length > 1 ? 's' : ''}`
                    }
                  </p>
                </Col>
                <Col md={4} className="text-end">
                  {hasChanges && (
                    <Button 
                      variant="outline-secondary" 
                      className="me-2"
                      onClick={handleReset}
                      disabled={saving}
                    >
                      Reset
                    </Button>
                  )}
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={handleSave}
                    disabled={saving || selectedGenres.length === 0}
                  >
                    {saving ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        💾 Save Preferences
                      </>
                    )}
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Selected Genres Summary */}
      {selectedGenres.length > 0 && (
        <Row className="mt-4">
          <Col md={12}>
            <Card>
              <Card.Body>
                <h5 className="mb-3">📖 Your Selected Genres</h5>
                <div className="d-flex flex-wrap gap-2">
                  {allGenres
                    .filter(genre => selectedGenres.includes(genre.id))
                    .map(genre => (
                      <Badge 
                        key={genre.id}
                        bg="primary" 
                        className="p-2 d-flex align-items-center"
                        style={{ fontSize: '0.9rem' }}
                      >
                        {genre.genreName}
                        <button
                          type="button"
                          className="btn-close btn-close-white ms-2"
                          aria-label="Remove"
                          style={{ fontSize: '0.6rem' }}
                          onClick={() => handleGenreToggle(genre.id)}
                        ></button>
                      </Badge>
                    ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default GenreSelection;