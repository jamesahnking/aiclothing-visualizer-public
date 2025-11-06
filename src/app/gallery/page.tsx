'use client';

import { useState } from 'react';
import { Row, Col, Card, Button, Form, InputGroup } from 'react-bootstrap';
import MainLayout from '@/components/layout/MainLayout';

// Mock data for gallery images
const mockImages = [
  {
    id: '1',
    type: 'try-on',
    imageUrl: 'https://placehold.co/600x800?text=Try-On+Image+1',
    createdAt: new Date('2025-06-15T10:30:00'),
  },
  {
    id: '2',
    type: 'composite',
    imageUrl: 'https://placehold.co/800x600?text=Composite+Image+1',
    createdAt: new Date('2025-06-15T11:45:00'),
  },
  {
    id: '3',
    type: 'try-on',
    imageUrl: 'https://placehold.co/600x800?text=Try-On+Image+2',
    createdAt: new Date('2025-06-16T09:15:00'),
  },
  {
    id: '4',
    type: 'composite',
    imageUrl: 'https://placehold.co/800x600?text=Composite+Image+2',
    createdAt: new Date('2025-06-16T14:20:00'),
  },
];

export default function Gallery() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  // Filter and sort images
  const filteredImages = mockImages
    .filter(image => {
      // Filter by type
      if (filterType !== 'all' && image.type !== filterType) {
        return false;
      }
      
      // Filter by search term (in a real app, this would search metadata)
      if (searchTerm && !image.type.includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by date
      if (sortOrder === 'newest') {
        return b.createdAt.getTime() - a.createdAt.getTime();
      } else {
        return a.createdAt.getTime() - b.createdAt.getTime();
      }
    });

  return (
    <MainLayout>
      <Row className="mb-4">
        <Col>
          <h1>Image Gallery</h1>
          <p className="lead">
            View and manage your generated images
          </p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <Form.Control
              placeholder="Search images..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>
              Clear
            </Button>
          </InputGroup>
        </Col>
        <Col md={3}>
          <Form.Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="try-on">Try-On Images</option>
            <option value="composite">Composite Images</option>
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </Form.Select>
        </Col>
      </Row>

      {filteredImages.length === 0 ? (
        <div className="text-center py-5">
          <p>No images found.</p>
          <Button variant="primary" href="/">
            Generate New Images
          </Button>
        </div>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {filteredImages.map((image) => (
            <Col key={image.id}>
              <Card>
                <Card.Img
                  variant="top"
                  src={image.imageUrl}
                  alt={`Generated ${image.type} image`}
                />
                <Card.Body>
                  <Card.Title>
                    {image.type === 'try-on' ? 'Try-On Image' : 'Composite Image'}
                  </Card.Title>
                  <Card.Text>
                    Created on {image.createdAt.toLocaleDateString()} at{' '}
                    {image.createdAt.toLocaleTimeString()}
                  </Card.Text>
                  <div className="d-flex justify-content-between">
                    <Button variant="outline-primary" size="sm">
                      Download
                    </Button>
                    <Button variant="outline-danger" size="sm">
                      Delete
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </MainLayout>
  );
}
