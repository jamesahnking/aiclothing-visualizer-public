'use client';

import { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Tabs, Tab, Alert, Spinner, Nav } from 'react-bootstrap';
import MainLayout from '@/components/layout/MainLayout';
import ImageUploader from '@/components/upload/ImageUploader';
import { uploadImage } from '@/lib/supabase/client';
import { generateUniqueFilename } from '@/utils/image-processing';

export default function Home() {
  // Main module selection
  const [activeModule, setActiveModule] = useState<'try-on' | 'scene-composition'>('try-on');
  
  // Module A: Virtual Try-On Flow state
  const [tryOnActiveTab, setTryOnActiveTab] = useState('upload-model');
  const [modelImageId, setModelImageId] = useState<string | null>(null);
  const [clothingImageId, setClothingImageId] = useState<string | null>(null);
  const [modelImageBase64, setModelImageBase64] = useState<string | null>(null);
  const [clothingImageBase64, setClothingImageBase64] = useState<string | null>(null);
  const [tryOnPrompt, setTryOnPrompt] = useState('A person wearing clothing');
  const [tryOnGeneratedImageUrl, setTryOnGeneratedImageUrl] = useState<string | null>(null);
  const [tryOnGeneratedImageBase64, setTryOnGeneratedImageBase64] = useState<string | null>(null);
  
  // Module B: Scene Composition Flow state
  const [sceneCompActiveTab, setSceneCompActiveTab] = useState('upload-figure');
  const [figureImageId, setFigureImageId] = useState<string | null>(null);
  const [sceneImageId, setSceneImageId] = useState<string | null>(null);
  const [figureImageBase64, setFigureImageBase64] = useState<string | null>(null);
  const [sceneImageBase64, setSceneImageBase64] = useState<string | null>(null);
  const [scenePrompt, setScenePrompt] = useState('');
  const [compositeImageUrl, setCompositeImageUrl] = useState<string | null>(null);
  
  // Shared state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Generation tracking state
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  
  // Composite generation tracking state
  const [compositeGenerationId, setCompositeGenerationId] = useState<string | null>(null);
  const [compositeGenerationStatus, setCompositeGenerationStatus] = useState<string | null>(null);
  const [compositeProgress, setCompositeProgress] = useState<number>(0);
  const [isCompositePolling, setIsCompositePolling] = useState<boolean>(false);

  // Module A: Virtual Try-On Flow handlers
  const handleModelUpload = async (file: File) => {
    setError(null);
    setIsUploading(true);
    
    try {
      // Generate a unique filename
      const filename = generateUniqueFilename(file.name, 'model');
      const path = filename;
      
      // Upload to Supabase
      console.log('[Frontend] Uploading model image to Supabase');
      const { error } = await uploadImage('model-images', path, file);
      
      if (error) throw error;
      
      // Store the path as the ID
      setModelImageId(path);
      
      // Create a base64 version of the image for direct API access
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setModelImageBase64(base64String);
        console.log('[Frontend] Model image base64 created');
      };
      reader.readAsDataURL(file);
      
      console.log('[Frontend] Model image uploaded successfully', { path });
      setSuccess('Model image uploaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('[Frontend] Error uploading model image:', error);
      
      // Provide more specific error message
      if (error instanceof Error) {
        if (error.message.includes('bucket') || error.message.includes('does not exist')) {
          setError(`Storage configuration issue: ${error.message}`);
        } else {
          setError(`Upload failed: ${error.message}`);
        }
      } else {
        setError('Failed to upload model image. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleClothingUpload = async (file: File) => {
    setError(null);
    setIsUploading(true);
    
    try {
      // Generate a unique filename
      const filename = generateUniqueFilename(file.name, 'clothing');
      const path = filename;
      
      // Upload to Supabase
      console.log('[Frontend] Uploading clothing image to Supabase');
      const { error } = await uploadImage('clothing-images', path, file);
      
      if (error) throw error;
      
      // Store the path as the ID
      setClothingImageId(path);
      
      // Create a base64 version of the image for direct API access
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setClothingImageBase64(base64String);
        console.log('[Frontend] Clothing image base64 created');
      };
      reader.readAsDataURL(file);
      
      console.log('[Frontend] Clothing image uploaded successfully', { path });
      setSuccess('Clothing image uploaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('[Frontend] Error uploading clothing image:', error);
      
      // Provide more specific error message
      if (error instanceof Error) {
        if (error.message.includes('bucket') || error.message.includes('does not exist')) {
          setError(`Storage configuration issue: ${error.message}`);
        } else {
          setError(`Upload failed: ${error.message}`);
        }
      } else {
        setError('Failed to upload clothing image. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Module B: Scene Composition Flow handlers
  const handleFigureUpload = async (file: File) => {
    setError(null);
    setIsUploading(true);
    
    try {
      // Generate a unique filename
      const filename = generateUniqueFilename(file.name, 'figure');
      const path = filename;
      
      // Upload to Supabase
      console.log('[Frontend] Uploading figure image to Supabase');
      const { error } = await uploadImage('figure-images', path, file);
      
      if (error) throw error;
      
      // Store the path as the ID
      setFigureImageId(path);
      
      // Create a base64 version of the image for direct API access
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFigureImageBase64(base64String);
        console.log('[Frontend] Figure image base64 created');
      };
      reader.readAsDataURL(file);
      
      console.log('[Frontend] Figure image uploaded successfully', { path });
      setSuccess('Figure image uploaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('[Frontend] Error uploading figure image:', error);
      
      // Provide more specific error message
      if (error instanceof Error) {
        if (error.message.includes('bucket') || error.message.includes('does not exist')) {
          setError(`Storage configuration issue: ${error.message}`);
        } else {
          setError(`Upload failed: ${error.message}`);
        }
      } else {
        setError('Failed to upload figure image. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleSceneUpload = async (file: File) => {
    setError(null);
    setIsUploading(true);
    
    try {
      // Generate a unique filename
      const filename = generateUniqueFilename(file.name, 'scene');
      const path = filename;
      
      // Upload to Supabase
      console.log('[Frontend] Uploading scene image to Supabase');
      const { error } = await uploadImage('scene-images', path, file);
      
      if (error) throw error;
      
      // Store the path as the ID
      setSceneImageId(path);
      
      // Create a base64 version of the image for direct API access
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSceneImageBase64(base64String);
        console.log('[Frontend] Scene image base64 created');
      };
      reader.readAsDataURL(file);
      
      console.log('[Frontend] Scene image uploaded successfully', { path });
      setSuccess('Scene image uploaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('[Frontend] Error uploading scene image:', error);
      
      // Provide more specific error message
      if (error instanceof Error) {
        if (error.message.includes('bucket') || error.message.includes('does not exist')) {
          setError(`Storage configuration issue: ${error.message}`);
        } else {
          setError(`Upload failed: ${error.message}`);
        }
      } else {
        setError('Failed to upload scene image. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Poll for try-on generation status
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    const pollGenerationStatus = async () => {
      if (!generationId || !isPolling) return;
      
      try {
        console.log('[Frontend] Polling generation status', { generationId });
        
        const response = await fetch(`/api/generate-try-on?id=${generationId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to check generation status');
        }
        
        console.log('[Frontend] Generation status received', { 
          status: data.status, 
          progress: data.progress,
          hasImageUrl: !!data.imageUrl
        });
        
        setGenerationStatus(data.status);
        setGenerationProgress(data.progress || 0);
        
        if (data.imageUrl) {
          setTryOnGeneratedImageUrl(data.imageUrl);
          
          // Also fetch the image as base64 for potential reuse in scene composition
          try {
            const imageResponse = await fetch(data.imageUrl);
            const blob = await imageResponse.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64String = reader.result as string;
              setTryOnGeneratedImageBase64(base64String);
            };
            reader.readAsDataURL(blob);
          } catch (error) {
            console.error('[Frontend] Error converting image to base64:', error);
          }
        }
        
        // Stop polling if generation is complete or failed
        if (data.status === 'completed' || data.status === 'failed') {
          setIsPolling(false);
          
          if (data.status === 'completed') {
            setSuccess('Try-on image generated successfully!');
            // Automatically move to results tab when image is ready
            setTryOnActiveTab('try-on-results');
          } else if (data.status === 'failed') {
            setError(`Generation failed: ${data.error || 'Unknown error'}`);
          }
        }
      } catch (error) {
        console.error('[Frontend] Error polling generation status:', error);
        setError('Failed to check generation status. Please try again.');
        setIsPolling(false);
      }
    };
    
    if (isPolling) {
      // Poll every 2 seconds
      intervalId = setInterval(pollGenerationStatus, 2000);
      // Initial poll
      pollGenerationStatus();
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [generationId, isPolling]);
  
  // Poll for composite generation status
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    const pollCompositeStatus = async () => {
      if (!compositeGenerationId || !isCompositePolling) return;
      
      try {
        console.log('[Frontend] Polling composite generation status', { compositeGenerationId });
        
        const response = await fetch(`/api/generate-composite?id=${compositeGenerationId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to check generation status');
        }
        
        console.log('[Frontend] Composite generation status received', { 
          status: data.status, 
          progress: data.progress,
          hasImageUrl: !!data.imageUrl
        });
        
        setCompositeGenerationStatus(data.status);
        setCompositeProgress(data.progress || 0);
        
        if (data.imageUrl) {
          setCompositeImageUrl(data.imageUrl);
        }
        
        // Stop polling if generation is complete or failed
        if (data.status === 'completed' || data.status === 'failed') {
          setIsCompositePolling(false);
          
          if (data.status === 'completed') {
            setSuccess('Composite image generated successfully!');
            // Automatically move to results tab when image is ready
            setSceneCompActiveTab('scene-results');
          } else if (data.status === 'failed') {
            setError(`Generation failed: ${data.error || 'Unknown error'}`);
          }
        }
      } catch (error) {
        console.error('[Frontend] Error polling composite generation status:', error);
        setError('Failed to check generation status. Please try again.');
        setIsCompositePolling(false);
      }
    };
    
    if (isCompositePolling) {
      // Poll every 2 seconds
      intervalId = setInterval(pollCompositeStatus, 2000);
      // Initial poll
      pollCompositeStatus();
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [compositeGenerationId, isCompositePolling]);

  const handleGenerateTryOn = async () => {
    if (!modelImageBase64 || !clothingImageBase64) {
      setError('Please upload both a model image and a clothing image.');
      return;
    }
    
    if (!tryOnPrompt || tryOnPrompt.length < 5) {
      setError('Please provide a descriptive prompt for the try-on (at least 5 characters).');
      return;
    }

    setError(null);
    setIsGenerating(true);
    
    try {
      console.log('[Frontend] Starting try-on generation process with base64 images');
      
      // Call the try-on API with the base64 image data
      const response = await fetch('/api/generate-try-on', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          modelImageBase64,
          clothingImageBase64,
          // Include IDs for reference and storage
          modelImageId,
          clothingImageId,
          prompt: tryOnPrompt,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate try-on image');
      }
      
      // Log detailed API response for debugging
      console.log('[Frontend] Try-on generation initiated', {
        ...data,
        apiDetails: data.debug || 'No debug info available'
      });
      
      // Store the generation ID and start polling
      setGenerationId(data.id);
      setGenerationStatus('processing');
      setIsPolling(true);
      
      setIsGenerating(false);
      setSuccess('Try-on generation initiated successfully!');
    } catch (error) {
      console.error('[Frontend] Error generating try-on:', error);
      setIsGenerating(false);
      setError('Failed to generate try-on image. Please try again.');
    }
  };

  const handleGenerateComposite = async () => {
    if (!figureImageBase64 || !sceneImageBase64 || !scenePrompt) {
      setError('Please upload both a figure image and a scene image, and provide a prompt.');
      return;
    }

    setError(null);
    setIsGenerating(true);
    
    try {
      console.log('[Frontend] Starting composite generation process');
      
      // Call the composite API with the base64 image data
      const response = await fetch('/api/generate-composite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          figureImageBase64: figureImageBase64,
          sceneImageBase64,
          // Include IDs for reference and storage
          figureImageId: figureImageId,
          sceneImageId,
          prompt: scenePrompt,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate composite image');
      }
      
      // Log detailed API response for debugging
      console.log('[Frontend] Composite generation initiated', {
        ...data,
        apiDetails: data.debug || 'No debug info available'
      });
      
      // Store the generation ID and start polling
      setCompositeGenerationId(data.id);
      setCompositeGenerationStatus('processing');
      setIsCompositePolling(true);
      
      setIsGenerating(false);
      setSuccess('Composite generation initiated successfully!');
    } catch (error) {
      console.error('[Frontend] Error generating composite:', error);
      setIsGenerating(false);
      setError('Failed to generate composite image. Please try again.');
    }
  };
  
  // Function to download an image
  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
      setError('Failed to download image. Please try again.');
    }
  };
  
  // Function to use try-on result as figure in scene composition
  const useTryOnResultAsSceneFigure = () => {
    if (tryOnGeneratedImageBase64) {
      setFigureImageBase64(tryOnGeneratedImageBase64);
      setFigureImageId('try-on-result');
      setActiveModule('scene-composition');
      setSceneCompActiveTab('upload-figure');
      setSuccess('Try-on result loaded as figure image!');
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError('No try-on result available to use.');
    }
  };

  return (
    <MainLayout>
      <Row className="mb-4">
        <Col>
          <h1>AI Clothing Visualizer</h1>
          <p className="lead">
            Generate realistic images of models wearing clothing in various environments
          </p>
        </Col>
      </Row>

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

      {/* Module Selection Tabs */}
      <Nav
        variant="tabs"
        activeKey={activeModule}
        onSelect={(k) => k && setActiveModule(k as 'try-on' | 'scene-composition')}
        className="mb-4"
      >
        <Nav.Item>
          <Nav.Link eventKey="try-on">Virtual Try-On</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="scene-composition">Scene Composition</Nav.Link>
        </Nav.Item>
      </Nav>

      {/* Module A: Virtual Try-On Flow */}
      {activeModule === 'try-on' && (
        <Tabs
          activeKey={tryOnActiveTab}
          onSelect={(k) => k && setTryOnActiveTab(k)}
          className="mb-4"
        >
          <Tab eventKey="upload-model" title="1. Upload Model">
            <Card>
              <Card.Body>
                <Card.Title>Upload Model Image</Card.Title>
                <Card.Text>
                  Upload an image of a model to visualize clothing on.
                </Card.Text>
                <ImageUploader
                  onImageSelected={handleModelUpload}
                  label="Model Image"
                  buttonText={isUploading ? "Uploading..." : "Select Model Image"}
                />
                <div className="d-flex justify-content-end mt-3">
                  <Button 
                    variant="primary" 
                    onClick={() => setTryOnActiveTab('upload-clothing')}
                    disabled={!modelImageId}
                  >
                    Next: Upload Clothing
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="upload-clothing" title="2. Upload Clothing">
            <Card>
              <Card.Body>
                <Card.Title>Upload Clothing Image</Card.Title>
                <Card.Text>
                  Upload an image of clothing to visualize on the model.
                </Card.Text>
                <ImageUploader
                  onImageSelected={handleClothingUpload}
                  label="Clothing Image"
                  buttonText={isUploading ? "Uploading..." : "Select Clothing Image"}
                />
                <div className="mt-3">
                  <label htmlFor="tryOnPrompt" className="form-label">Try-On Prompt</label>
                  <textarea
                    id="tryOnPrompt"
                    className="form-control"
                    rows={2}
                    placeholder="Describe how the clothing should appear on the model..."
                    value={tryOnPrompt}
                    onChange={(e) => setTryOnPrompt(e.target.value)}
                  ></textarea>
                </div>
                <div className="d-flex justify-content-between mt-3">
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setTryOnActiveTab('upload-model')}
                  >
                    Back
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handleGenerateTryOn}
                    disabled={!clothingImageId || !tryOnPrompt || tryOnPrompt.length < 5 || isGenerating || isUploading}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Try-On'}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="try-on-results" title="3. Results">
            <Card>
              <Card.Body>
                <Card.Title>Try-On Results</Card.Title>
                <Card.Text>
                  View your generated try-on image.
                </Card.Text>
                
                {isPolling && (
                  <div className="text-center py-5">
                    <Spinner animation="border" role="status" variant="primary" />
                    <p className="mt-3">
                      Generating your try-on image... {generationProgress}%
                    </p>
                    <p className="text-muted">
                      Status: {generationStatus || 'processing'} - This may take up to 30 seconds.
                    </p>
                  </div>
                )}
                
                {!isPolling && !tryOnGeneratedImageUrl && (
                  <div className="text-center py-5">
                    <p>No generated images yet.</p>
                    <p className="text-muted">
                      Complete the previous steps to generate images.
                    </p>
                  </div>
                )}
                
                {tryOnGeneratedImageUrl && (
                  <div className="text-center py-3">
                    <h5 className="mb-3">Try-On Result</h5>
                    <div className="mb-3">
                      <img 
                        src={tryOnGeneratedImageUrl} 
                        alt="Generated try-on image" 
                        className="img-fluid rounded shadow" 
                        style={{ minWidth: '500px', width: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <p className="text-success">
                      Try-on image generated successfully!
                    </p>
                    <div className="d-flex justify-content-center gap-2 mt-3">
                      <Button 
                        variant="outline-primary" 
                        onClick={() => tryOnGeneratedImageUrl && downloadImage(tryOnGeneratedImageUrl, 'try-on-result.png')}
                      >
                        Download Image
                      </Button>
                      <Button 
                        variant="outline-success" 
                        onClick={useTryOnResultAsSceneFigure}
                      >
                        Use in Scene Composition
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="d-flex justify-content-between mt-3">
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setTryOnActiveTab('upload-clothing')}
                  >
                    Back
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={() => {
                      setModelImageId(null);
                      setClothingImageId(null);
                      setTryOnPrompt('A person wearing clothing');
                      setGenerationId(null);
                      setGenerationStatus(null);
                      setTryOnGeneratedImageUrl(null);
                      setTryOnGeneratedImageBase64(null);
                      setIsPolling(false);
                      setTryOnActiveTab('upload-model');
                    }}
                  >
                    Start New Try-On
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>
      )}

      {/* Module B: Scene Composition Flow */}
      {activeModule === 'scene-composition' && (
        <Tabs
          activeKey={sceneCompActiveTab}
          onSelect={(k) => k && setSceneCompActiveTab(k)}
          className="mb-4"
        >
          <Tab eventKey="upload-figure" title="1. Upload Figure">
            <Card>
              <Card.Body>
                <Card.Title>Upload Figure Image</Card.Title>
                <Card.Text>
                  Upload an image of a person or object to place in a scene.
                </Card.Text>
                <ImageUploader
                  onImageSelected={handleFigureUpload}
                  label="Figure Image"
                  buttonText={isUploading ? "Uploading..." : "Select Figure Image"}
                />
                {figureImageBase64 && (
                  <div className="text-center mt-3">
                    <p className="text-success">Figure image uploaded successfully!</p>
                  </div>
                )}
                <div className="d-flex justify-content-end mt-3">
                  <Button 
                    variant="primary" 
                    onClick={() => setSceneCompActiveTab('upload-scene')}
                    disabled={!figureImageBase64}
                  >
                    Next: Upload Scene
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="upload-scene" title="2. Upload Scene">
            <Card>
              <Card.Body>
                <Card.Title>Upload Scene Image</Card.Title>
                <Card.Text>
                  Upload a scene image where the figure will be placed.
                </Card.Text>
                <ImageUploader
                  onImageSelected={handleSceneUpload}
                  label="Scene Image"
                  buttonText={isUploading ? "Uploading..." : "Select Scene Image"}
                />
                <div className="mt-3">
                  <label htmlFor="scenePrompt" className="form-label">Scene Composition Prompt</label>
                  <textarea
                    id="scenePrompt"
                    className="form-control"
                    rows={3}
                    placeholder="Describe how the figure should be placed in the scene..."
                    value={scenePrompt}
                    onChange={(e) => setScenePrompt(e.target.value)}
                  ></textarea>
                </div>
                <div className="d-flex justify-content-between mt-3">
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setSceneCompActiveTab('upload-figure')}
                  >
                    Back
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handleGenerateComposite}
                    disabled={!sceneImageId || !scenePrompt || isGenerating || isUploading}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Composite'}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="scene-results" title="3. Results">
            <Card>
              <Card.Body>
                <Card.Title>Scene Composition Results</Card.Title>
                <Card.Text>
                  View your generated composite image.
                </Card.Text>
                
                {isCompositePolling && (
                  <div className="text-center py-5">
                    <Spinner animation="border" role="status" variant="primary" />
                    <p className="mt-3">
                      Generating your composite image... {compositeProgress}%
                    </p>
                    <p className="text-muted">
                      Status: {compositeGenerationStatus || 'processing'} - This may take up to 30 seconds.
                    </p>
                  </div>
                )}
                
                {!isCompositePolling && !compositeImageUrl && (
                  <div className="text-center py-5">
                    <p>No composite images yet.</p>
                    <p className="text-muted">
                      Complete the previous steps to generate a composite image.
                    </p>
                  </div>
                )}
                
                {compositeImageUrl && (
                  <div className="text-center py-3">
                    <h5 className="mb-3">Composite Result</h5>
                    <div className="mb-3">
                      <img 
                        src={compositeImageUrl} 
                        alt="Generated composite image" 
                        className="img-fluid rounded shadow" 
                        style={{ minWidth: '500px', width: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <p className="text-success">
                      Composite image generated successfully!
                    </p>
                    <div className="d-flex justify-content-center mt-3">
                      <Button 
                        variant="outline-primary" 
                        onClick={() => compositeImageUrl && downloadImage(compositeImageUrl, 'composite-result.png')}
                      >
                        Download Image
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="d-flex justify-content-between mt-3">
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setSceneCompActiveTab('upload-scene')}
                  >
                    Back
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={() => {
                      setFigureImageId(null);
                      setSceneImageId(null);
                      setFigureImageBase64(null);
                      setSceneImageBase64(null);
                      setScenePrompt('');
                      setCompositeImageUrl(null);
                      setCompositeGenerationId(null);
                      setCompositeGenerationStatus(null);
                      setCompositeProgress(0);
                      setIsCompositePolling(false);
                      setSceneCompActiveTab('upload-figure');
                    }}
                  >
                    Start New Composition
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>
      )}
    </MainLayout>
  );
}
