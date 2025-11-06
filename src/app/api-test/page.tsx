'use client';

import { useState } from 'react';
import { Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import MainLayout from '@/components/layout/MainLayout';

export default function ApiTestPage() {
  const [tryOnId, setTryOnId] = useState<string | null>(null);
  const [compositeId, setCompositeId] = useState<string | null>(null);
  type GenerationStatus = {
    id: string;
    status: 'processing' | 'completed' | 'failed';
    progress: number;
    imageUrl?: string;
    error?: string;
  };

  const [tryOnStatus, setTryOnStatus] = useState<GenerationStatus | null>(null);
  const [compositeStatus, setCompositeStatus] = useState<GenerationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Mock IDs for testing - in a real app, these would come from uploaded images
  const mockModelImageId = 'mock-model-123';
  const mockClothingImageId = 'mock-clothing-456';
  const mockSceneImageId = 'mock-scene-789';
  const mockPrompt = 'Person standing in a park on a sunny day';

  const testTryOnApi = async () => {
    console.log('[Test] Testing Try-On API');
    setLoading(true);
    setError(null);
    
    try {
      // Call the generate-try-on API
      const response = await fetch('/api/generate-try-on', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelImageId: mockModelImageId,
          clothingImageId: mockClothingImageId,
        }),
      });
      
      const data = await response.json();
      console.log('[Test] Try-On API response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate try-on image');
      }
      
      setTryOnId(data.id);
      setSuccess('Try-on generation initiated successfully!');
      
      // Start polling for status
      pollTryOnStatus(data.id);
    } catch (err) {
      console.error('[Test] Error testing Try-On API:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const testCompositeApi = async () => {
    console.log('[Test] Testing Composite API');
    setLoading(true);
    setError(null);
    
    try {
      // Call the generate-composite API
      const response = await fetch('/api/generate-composite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tryOnImageId: mockModelImageId, // Using mock ID for testing
          sceneImageId: mockSceneImageId,
          prompt: mockPrompt,
        }),
      });
      
      const data = await response.json();
      console.log('[Test] Composite API response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate composite image');
      }
      
      setCompositeId(data.id);
      setSuccess('Composite generation initiated successfully!');
      
      // Start polling for status
      pollCompositeStatus(data.id);
    } catch (err) {
      console.error('[Test] Error testing Composite API:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const pollTryOnStatus = async (id: string) => {
    try {
      console.log('[Test] Polling Try-On status for ID:', id);
      const response = await fetch(`/api/generate-try-on?id=${id}`);
      const data = await response.json();
      
      console.log('[Test] Try-On status update:', data);
      setTryOnStatus(data);
      
      // If still processing, poll again after a delay
      if (data.status === 'processing') {
        setTimeout(() => pollTryOnStatus(id), 2000);
      }
    } catch (err) {
      console.error('[Test] Error polling Try-On status:', err);
    }
  };

  const pollCompositeStatus = async (id: string) => {
    try {
      console.log('[Test] Polling Composite status for ID:', id);
      const response = await fetch(`/api/generate-composite?id=${id}`);
      const data = await response.json();
      
      console.log('[Test] Composite status update:', data);
      setCompositeStatus(data);
      
      // If still processing, poll again after a delay
      if (data.status === 'processing') {
        setTimeout(() => pollCompositeStatus(id), 2000);
      }
    } catch (err) {
      console.error('[Test] Error polling Composite status:', err);
    }
  };

  return (
    <MainLayout>
      <h1 className="mb-4">API Test Page</h1>
      <p className="lead mb-4">
        This page tests the API endpoints and displays console debugging messages.
        Open your browser&apos;s developer tools to see the console output.
      </p>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
          {success}
        </Alert>
      )}
      
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>Try-On API Test</Card.Header>
            <Card.Body>
              <Card.Text>
                Test the generate-try-on API endpoint with mock data.
              </Card.Text>
              <Button 
                variant="primary" 
                onClick={testTryOnApi}
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
                    Testing...
                  </>
                ) : 'Test Try-On API'}
              </Button>
              
              {tryOnId && (
                <div className="mt-3">
                  <h5>Generation ID:</h5>
                  <code>{tryOnId}</code>
                  
                  {tryOnStatus && (
                    <div className="mt-2">
                      <h5>Status:</h5>
                      <pre className="bg-light p-2 rounded">
                        {JSON.stringify(tryOnStatus, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header>Composite API Test</Card.Header>
            <Card.Body>
              <Card.Text>
                Test the generate-composite API endpoint with mock data.
              </Card.Text>
              <Button 
                variant="primary" 
                onClick={testCompositeApi}
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
                    Testing...
                  </>
                ) : 'Test Composite API'}
              </Button>
              
              {compositeId && (
                <div className="mt-3">
                  <h5>Generation ID:</h5>
                  <code>{compositeId}</code>
                  
                  {compositeStatus && (
                    <div className="mt-2">
                      <h5>Status:</h5>
                      <pre className="bg-light p-2 rounded">
                        {JSON.stringify(compositeStatus, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <div className="bg-light p-3 rounded">
        <h4>Instructions:</h4>
        <ol>
          <li>Open your browser&apos;s developer tools (F12 or right-click and select &quot;Inspect&quot;)</li>
          <li>Go to the &quot;Console&quot; tab</li>
          <li>Click one of the test buttons above</li>
          <li>Watch the console for debug messages from the API</li>
        </ol>
        <p className="mb-0">
          <strong>Note:</strong> The API calls may fail if the mock IDs don&apos;t exist in your database.
          This is expected and still demonstrates the console debugging messages.
        </p>
      </div>
    </MainLayout>
  );
}
