import React, { useState, useRef } from 'react';
import { Button, Form, Alert } from 'react-bootstrap';

interface ImageUploaderProps {
  onImageSelected: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  buttonText?: string;
  className?: string;
}

export default function ImageUploader({
  onImageSelected,
  accept = 'image/jpeg, image/png, image/svg+xml',
  maxSizeMB = 5,
  label = 'Upload Image',
  buttonText = 'Select Image',
  className = '',
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const processFile = (file?: File) => {
    setError(null);
    
    if (!file) {
      setError('No file selected');
      return;
    }

    // Check file type
    if (!file.type.match(/^image\/(jpeg|png|svg\+xml)$/)) {
      setError('Please upload a JPEG, PNG, or SVG image');
      return;
    }

    // Check file size
    if (file.size > maxSizeBytes) {
      setError(`File size exceeds the maximum limit of ${maxSizeMB}MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Pass file to parent component
    onImageSelected(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <Form.Group controlId="imageUpload">
        {label && <Form.Label>{label}</Form.Label>}
        
        <div
          className={`border rounded p-3 text-center ${isDragging ? 'bg-light border-primary' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{ cursor: 'pointer' }}
          onClick={handleButtonClick}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={accept}
            style={{ display: 'none' }}
          />
          
          {preview ? (
            <div className="mb-3">
              <img
                src={preview}
                alt="Preview"
                className="img-fluid"
                style={{ minWidth: '500px', width: '100%', objectFit: 'contain' }}
              />
            </div>
          ) : (
            <div className="py-4">
              <i className="bi bi-cloud-upload fs-1"></i>
              <p className="mt-2">Drag and drop an image here, or click to select</p>
              <small className="text-muted d-block">
                Accepted formats: JPEG, PNG, SVG
              </small>
              <small className="text-muted d-block">
                Maximum size: {maxSizeMB}MB
              </small>
            </div>
          )}
          
          <Button variant="outline-primary" className="mt-2">
            {buttonText}
          </Button>
        </div>
        
        {error && (
          <Alert variant="danger" className="mt-2">
            {error}
          </Alert>
        )}
      </Form.Group>
    </div>
  );
}
