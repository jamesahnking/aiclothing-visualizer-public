import React from 'react';
import { Container, Navbar, Nav, NavDropdown } from 'react-bootstrap';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, signOut, isLoading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth');
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Link href="/" passHref legacyBehavior>
            <Navbar.Brand>AI Clothing Visualizer</Navbar.Brand>
          </Link>
          
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Link href="/" passHref legacyBehavior>
                <Nav.Link>Home</Nav.Link>
              </Link>
              <Link href="/gallery" passHref legacyBehavior>
                <Nav.Link>Gallery</Nav.Link>
              </Link>
              <Link href="/api-test" passHref legacyBehavior>
                <Nav.Link>API Test</Nav.Link>
              </Link>
              
              {!isLoading && (
                user ? (
                  <NavDropdown 
                    title={user.email?.split('@')[0] || 'User'} 
                    id="user-dropdown"
                  >
                    <NavDropdown.Item as="div">
                      <div className="text-muted px-2 small">
                        Signed in as: <br />
                        <strong>{user.email}</strong>
                      </div>
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={handleSignOut}>
                      Sign Out
                    </NavDropdown.Item>
                  </NavDropdown>
                ) : (
                  <Link href="/auth" passHref legacyBehavior>
                    <Nav.Link>Sign In</Nav.Link>
                  </Link>
                )
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="flex-grow-1 mb-4">
        {children}
      </Container>

      <footer className="bg-light py-4 mt-auto">
        <Container>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <span className="text-muted">© {new Date().getFullYear()} AI Clothing Visualizer</span>
            </div>
            <div>
              <a href="#" className="text-decoration-none text-muted me-3">Privacy Policy</a>
              <a href="#" className="text-decoration-none text-muted">Terms of Service</a>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
