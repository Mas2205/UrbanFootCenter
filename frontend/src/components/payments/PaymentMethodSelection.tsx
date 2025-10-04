import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  Paper
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaymentsIcon from '@mui/icons-material/Payments';
import { useTranslation } from 'react-i18next';

interface PaymentMethodSelectionProps {
  value: string;
  onChange: (method: string) => void;
  error?: boolean;
  helperText?: string;
}

const PaymentMethodSelection: React.FC<PaymentMethodSelectionProps> = ({
  value,
  onChange,
  error,
  helperText
}) => {
  const { t } = useTranslation();

  return (
    <FormControl component="fieldset" fullWidth error={error}>
      <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold' }}>
        Mode de paiement
      </FormLabel>
      <RadioGroup 
        aria-label="payment-method" 
        name="payment-method" 
        value={value} 
        onChange={(event) => onChange(event.target.value)}
      >
        <FormControlLabel
          value="wave"
          control={<Radio />}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: '#FF6B35', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                mr: 1
              }}>
                <Typography variant="caption" color="white" fontWeight="bold">W</Typography>
              </Box>
              <Typography>Wave</Typography>
            </Box>
          }
        />
        <FormControlLabel
          value="orange_money"
          control={<Radio />}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: '#FF7900', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                mr: 1
              }}>
                <Typography variant="caption" color="white" fontWeight="bold">OM</Typography>
              </Box>
              <Typography>Orange Money</Typography>
            </Box>
          }
        />
        <FormControlLabel
          value="card"
          control={<Radio />}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CreditCardIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography>Carte bancaire</Typography>
            </Box>
          }
        />
        <FormControlLabel
          value="cash"
          control={<Radio />}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PaymentsIcon sx={{ mr: 1, color: 'success.main' }} />
              <Typography>Espèces</Typography>
            </Box>
          }
        />
      </RadioGroup>
      {helperText && <Typography color="error" variant="caption">{helperText}</Typography>}
    </FormControl>
  );
};

export default PaymentMethodSelection;
