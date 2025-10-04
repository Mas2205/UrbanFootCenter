import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTranslation } from 'react-i18next';
import { LinearProgress } from '@mui/material';

// Theme
import theme from './theme';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';

// Routes
import AppRoutes from './routes';

function App() {
  const { i18n } = useTranslation();

  // Initialiser la langue à partir du localStorage ou utiliser la langue par défaut
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      // Utilisation de la méthode moderne pour changer la langue
      void i18n.changeLanguage?.(savedLanguage) || i18n.setLanguage?.(savedLanguage);
    } else {
      // Langue par défaut: français
      void i18n.changeLanguage?.('fr') || i18n.setLanguage?.('fr');
      localStorage.setItem('language', 'fr');
    }
  }, [i18n]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Suspense fallback={
            <LinearProgress color="primary" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }} />
          }>
            <AppRoutes />
          </Suspense>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
