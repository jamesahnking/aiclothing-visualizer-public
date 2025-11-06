'use client';

import { useState } from 'react';
import { Row, Col, Card, Form, Button, Alert, Tabs, Tab } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/lib/supabase/client';

export default function Auth() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      setSuccess('Sign in successful! Redirecting...');
      
      // Redirect to home page after successful sign-in
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during sign in.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      // Create user account
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });
      
      if (signUpError) throw signUpError;
      
      setSuccess('Account created successfully! Please check your email for verification.');
      
      // Reset form and switch to sign in tab
      setPassword('');
      setConfirmPassword('');
      setName('');
      setTimeout(() => {
        setActiveTab('signin');
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during sign up.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <Row className="justify-content-center">
        <Col md={6}>
          <Card>
            <Card.Body>
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => k && setActiveTab(k)}
                className="mb-4"
              >
                <Tab eventKey="signin" title="Sign In">
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
                  
                  <Form onSubmit={handleSignIn}>
                    <Form.Group className="mb-3" controlId="signInEmail">
                      <Form.Label>Email address</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Enter email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="signInPassword">
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </Form.Group>

                    <div className="d-flex justify-content-between align-items-center">
                      <Form.Check
                        type="checkbox"
                        label="Remember me"
                        id="rememberMe"
                      />
                      <Button 
                        variant="link" 
                        className="p-0 text-decoration-none"
                        onClick={async () => {
                          if (!email) {
                            setError('Please enter your email address to reset password.');
                            return;
                          }
                          try {
                            const { error } = await supabase.auth.resetPasswordForEmail(email);
                            if (error) throw error;
                            setSuccess('Password reset email sent. Please check your inbox.');
                          } catch (err: unknown) {
                            const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email.';
                            setError(errorMessage);
                          }
                        }}
                      >
                        Forgot password?
                      </Button>
                    </div>

                    <Button
                      variant="primary"
                      type="submit"
                      className="w-100 mt-4"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </Form>
                </Tab>
                
                <Tab eventKey="signup" title="Sign Up">
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
                  
                  <Form onSubmit={handleSignUp}>
                    <Form.Group className="mb-3" controlId="signUpName">
                      <Form.Label>Name (optional)</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="signUpEmail">
                      <Form.Label>Email address</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Enter email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      <Form.Text className="text-muted">
                        We&apos;ll never share your email with anyone else.
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="signUpPassword">
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="signUpConfirmPassword">
                      <Form.Label>Confirm Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </Form.Group>

                    <Form.Check
                      type="checkbox"
                      label="I agree to the Terms of Service and Privacy Policy"
                      id="termsAgreement"
                      className="mb-3"
                      required
                    />

                    <Button
                      variant="primary"
                      type="submit"
                      className="w-100"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </Form>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </MainLayout>
  );
}
