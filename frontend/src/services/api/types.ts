import { AxiosInstance } from 'axios';
import adminAPI from './adminAPI';
import userAPI from './userAPI';
import fieldAPI from './fieldAPI';
import reservationAPI from './reservationAPI';
import settingsAPI from './settingsAPI';
import paymentAPI from './paymentAPI';

// Type declarations for API modules
type AdminAPI = typeof adminAPI;
type UserAPI = typeof userAPI;
type FieldAPI = typeof fieldAPI;
type ReservationAPI = typeof reservationAPI;
type SettingsAPI = typeof settingsAPI;
type PaymentAPI = typeof paymentAPI;

export interface API extends AxiosInstance {
  auth: UserAPI;
  user: UserAPI;
  field: FieldAPI;
  reservation: ReservationAPI;
  admin: AdminAPI;
  settings: SettingsAPI;
  payment: PaymentAPI;
}
