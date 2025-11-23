import { useState, useEffect } from 'react';
import { FcAbout } from "react-icons/fc";

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
import LoadingSpinner from '../common/LoadingSpinner';

function GenreSelection() {
  const { user } = useAuth();
  const [allGenres, setAllGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState(null);
  
  const [newGenreName, setNewGenreName] = useState('');
  const [newGenreDescription, setNewGenreDescription] = useState('');
  const [addingNewGenre, setAddingNewGenre] = useState(false);

  useEffect(() => {
    fetchGenresData();
  }, []);

  const fetchGenresData = async () => {
    setLoading(true);
    setError('');

    try {
      const allGenresResponse = await userApi.get('/api/genres');
      setAllGenres(allGenresResponse.data);

      try {
        const userGenresResponse = await userApi.get('/api/genres/user');
        const userGenreIds = userGenresResponse.data.map(genre => genre.id);
        setSelectedGenres(userGenreIds);
      } catch (err) {
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
      await userApi.post('/api/genres/user', { 
        genreIds: selectedGenres 
      });
      
      toast.success('Genres saved successfully!');
      setHasChanges(false);
      await fetchGenresData();
    } catch (error) {
      console.error('Error saving genres:', error);
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

  const handleAddNewGenre = async () => {
    if (!newGenreName.trim()) return;

    setAddingNewGenre(true);
    try {
      const response = await userApi.post('/api/genres/user/new', {
        genreName: newGenreName,
        description: newGenreDescription
      });

      const newGenre = response.data;

      setAllGenres(prev => [...prev, newGenre]);
      setSelectedGenres(prev => [...prev, newGenre.id]);
      setHasChanges(true);

      toast.success(`Genre "${newGenre.genreName}" added and selected!`);
      setNewGenreName('');
      setNewGenreDescription('');
    } catch (error) {
      console.error('Error adding new genre:', error.response?.data || error);
      toast.error('Failed to add new genre. Please try again.');
    } finally {
      setAddingNewGenre(false);
    }
  };

  const isGenreSelected = (genreId) => selectedGenres.includes(genreId);

  if (loading) {
    return (
      
        
            <LoadingSpinner message='Loading Genres...'/>
            
  
    );
  }

  if (error && allGenres.length === 0) {
    return (
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', paddingTop: '2rem' }}>
        <Container className="mt-5">
          <Alert variant="danger" className="border-0 shadow-sm">
            <Alert.Heading>⚠️ Error Loading Genres</Alert.Heading>
            <p>{error}</p>
            <Button variant="outline-danger" onClick={fetchGenresData}>
              🔄 Try Again
            </Button>
          </Alert>
        </Container>
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      minHeight: '100vh', 
      paddingBottom: '4rem',
      position: 'relative'
    }}>
      {/* Overlay for better readability */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(255, 255, 255, 0.95)',
        zIndex: 0
      }} />
      <Container className="py-4" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header Section */}
        <Row className="mb-4">
          <Col md={12}>
            <Card className="border-0 shadow-sm" style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}>
              <Card.Body className="py-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap">
                  <div>
                    <h2 className="mb-2 fw-bold">📚 Select Your Literary Genres</h2>
                    <p className="mb-0 opacity-75">
                      Choose genres that interest you, {user?.businessName || user?.username}
                    </p>
                  </div>
                  <div className="mt-3 mt-md-0">
                    <div className="text-center bg-white bg-opacity-10 rounded p-3 backdrop-blur">
                      <h3 className="mb-0 fw-bold">{selectedGenres.length}/{allGenres.length}</h3>
                      <small className="opacity-75">Selected</small>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Info Alert */}
        <Row className="mb-4">
          <Col md={12}>
            <Alert variant="info" className="border-0 shadow-sm d-flex align-items-start">
              <span className="me-3 fs-4"><FcAbout /></span>
              <div>
                <strong>Why select genres?</strong> This helps us personalize your bookfair 
                experience and recommend relevant stalls and books tailored to your interests.
              </div>
            </Alert>
          </Col>
        </Row>

        {/* Action Bar */}
        <Row className="mb-4">
          <Col md={12}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="py-3">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <Button 
                    variant="outline-primary"
                    onClick={handleSelectAll}
                  >
                    {selectedGenres.length === allGenres.length ? '☐ Deselect All' : '☑ Select All'}
                  </Button>
                  
                  {hasChanges && (
                    <Badge bg="warning" text="dark" className="px-3 py-2 fs-6">
                      ⚠️ You have unsaved changes
                    </Badge>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Add New Genre Form */}
        <Row className="mb-4">
          <Col md={12}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-3">
                  <div style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>➕</div>
                  <h5 className="mb-0 fw-bold">Add a New Genre</h5>
                </div>
                <Form>
                  <Row className="g-3 align-items-end">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Genre Name *</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g., Science Fiction"
                          value={newGenreName}
                          onChange={(e) => setNewGenreName(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={5}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Description (Optional)</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Brief description of the genre"
                          value={newGenreDescription}
                          onChange={(e) => setNewGenreDescription(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Button
                        variant="success"
                        className="w-100"
                        onClick={handleAddNewGenre}
                        disabled={!newGenreName.trim() || addingNewGenre}
                      >
                        {addingNewGenre ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            Adding...
                          </>
                        ) : (
                          '➕ Add Genre'
                        )}
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Genre Cards Grid */}
        <Row className="g-3 mb-4">
          {allGenres.map((genre) => {
            const selected = isGenreSelected(genre.id);
            return (
              <Col md={4} sm={6} key={genre.id}>
                <Card 
                  className={`h-100 border-0 shadow-sm ${selected ? 'border-3' : ''}`}
                  style={{ 
                    cursor: 'pointer', 
                    transition: 'all 0.2s ease',
                    backgroundColor: selected ? '#e7f3ff' : 'white',
                    borderLeft: selected ? '4px solid #667eea' : '4px solid transparent',
                    transform: selected ? 'scale(1.02)' : 'scale(1)'
                  }}
                  onClick={() => handleGenreToggle(genre.id)}
                  onMouseEnter={(e) => {
                    if (!selected) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    }
                  }}
                >
                  <Card.Body className="p-3">
                    <div className="d-flex align-items-start">
                      <Form.Check
                        type="checkbox"
                        id={`genre-${genre.id}`}
                        checked={selected}
                        onChange={() => handleGenreToggle(genre.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="me-3 mt-1"
                        style={{ transform: 'scale(1.2)' }}
                      />
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <strong className="text-dark fs-6">{genre.genreName}</strong>
                          {selected && (
                            <Badge bg="success" className="ms-2">✓</Badge>
                          )}
                        </div>
                        {genre.description && (
                          <small className="text-muted d-block" style={{ lineHeight: '1.5' }}>
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

        {/* Selected Genres Summary */}
        {selectedGenres.length > 0 && (
          <Row className="mb-4">
            <Col md={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>📖</div>
                    <h5 className="mb-0 fw-bold">Your Selected Genres ({selectedGenres.length})</h5>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {allGenres
                      .filter(genre => selectedGenres.includes(genre.id))
                      .map(genre => (
                        <Badge 
                          key={genre.id}
                          bg="primary" 
                          className="p-2 d-flex align-items-center"
                          style={{ fontSize: '0.95rem', cursor: 'pointer' }}
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

        {/* Save Section */}
        <Row className="mb-5">
          <Col md={12}>
            <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #10b981' }}>
              <Card.Body className="p-4">
                <Row className="align-items-center">
                  <Col md={8}>
                    <h5 className="mb-2 fw-bold">💾 Save Your Preferences</h5>
                    <p className="text-muted mb-0">
                      {selectedGenres.length === 0 
                        ? 'Please select at least one genre to continue' 
                        : `You have selected ${selectedGenres.length} genre${selectedGenres.length > 1 ? 's' : ''}. Don't forget to save your changes!`
                      }
                    </p>
                  </Col>
                  <Col md={4} className="text-end mt-3 mt-md-0">
                    {hasChanges && (
                      <Button 
                        variant="outline-secondary" 
                        className="me-2"
                        onClick={handleReset}
                        disabled={saving}
                      >
                        🔄 Reset
                      </Button>
                    )}
                    <Button 
                      variant="success"
                      size="lg"
                      onClick={handleSave}
                      disabled={saving || selectedGenres.length === 0}
                      className="px-4"
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
                        <>💾 Save Preferences</>
                      )}
                    </Button>
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

export default GenreSelection;