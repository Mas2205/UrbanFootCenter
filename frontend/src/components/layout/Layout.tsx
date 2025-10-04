import React, { ReactNode } from 'react';
import { Box, Container, CssBaseline } from '@mui/material';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}

const Layout: React.FC<LayoutProps> = ({ children, maxWidth = 'lg' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <CssBaseline />
      <Navbar />
      <Container 
        component="main" 
        maxWidth={maxWidth}
        sx={{ 
          flexGrow: 1,
          py: 4, 
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </Container>
      <Footer />
    </Box>
  );
};

export default Layout;
