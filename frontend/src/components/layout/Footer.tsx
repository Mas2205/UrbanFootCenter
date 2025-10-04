import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  IconButton, 
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  WhatsApp, 
  Email, 
  Phone, 
  LocationOn 
} from '@mui/icons-material';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const currentYear = new Date().getFullYear();

  return (
    <Box
      sx={{
        bgcolor: 'primary.main',
        color: 'white',
        py: 6,
        mt: 'auto'
      }}
      component="footer"
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid sx={{ gridColumn: { xs: "span 12", sm: "span 6", md: "span 3" } }}>
            <Typography variant="h6" gutterBottom>
              Urban Foot Center
            </Typography>
            <Typography variant="body2">
              {t('app.slogan')}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <IconButton color="inherit" aria-label="Facebook">
                <Facebook />
              </IconButton>
              <IconButton color="inherit" aria-label="Instagram">
                <Instagram />
              </IconButton>
              <IconButton color="inherit" aria-label="Twitter">
                <Twitter />
              </IconButton>
              <IconButton color="inherit" aria-label="WhatsApp">
                <WhatsApp />
              </IconButton>
            </Box>
          </Grid>

          <Grid sx={{ gridColumn: { xs: "span 12", sm: "span 6", md: "span 3" } }}>
            <Typography variant="h6" gutterBottom>
              {t('footer.about')}
            </Typography>
            <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
              <Box component="li" sx={{ mb: 1 }}>
                <Link to="/about" style={{ color: 'white', textDecoration: 'none' }}>
                  {t('footer.about')}
                </Link>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <Link to="/terms" style={{ color: 'white', textDecoration: 'none' }}>
                  {t('footer.terms')}
                </Link>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <Link to="/privacy" style={{ color: 'white', textDecoration: 'none' }}>
                  {t('footer.privacy')}
                </Link>
              </Box>
            </Box>
          </Grid>

          <Grid sx={{ gridColumn: { xs: "span 12", sm: "span 6", md: "span 3" } }}>
            <Typography variant="h6" gutterBottom>
              {t('footer.contact')}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', mb: 1 }}>
                <LocationOn sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Dakar, Sénégal
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', mb: 1 }}>
                <Phone sx={{ mr: 1 }} />
                <Typography variant="body2">
                  +221 77 123 45 67
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', mb: 1 }}>
                <Email sx={{ mr: 1 }} />
                <Typography variant="body2">
                  contact@urbanfootcenter.sn
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid sx={{ gridColumn: { xs: "span 12", sm: "span 6", md: "span 3" } }}>
            <Typography variant="h6" gutterBottom>
              Horaires
            </Typography>
            <Typography variant="body2">
              Lun - Ven: 9h - 23h
            </Typography>
            <Typography variant="body2">
              Sam - Dim: 8h - 00h
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              Jours fériés: 10h - 22h
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, backgroundColor: 'rgba(255,255,255,0.2)' }} />

        <Box sx={{ display: 'flex', justifyContent: isMobile ? 'center' : 'space-between', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center' }}>
          <Typography variant="body2" align={isMobile ? 'center' : 'left'}>
            {t('footer.copyright').replace('2025', currentYear.toString())}
          </Typography>
          {!isMobile && (
            <Box>
              <Link to="/terms" style={{ color: 'white', marginRight: '1rem', textDecoration: 'none' }}>
                {t('footer.terms')}
              </Link>
              <Link to="/privacy" style={{ color: 'white', textDecoration: 'none' }}>
                {t('footer.privacy')}
              </Link>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
