import { clarity } from 'react-microsoft-clarity';

if (import.meta.env.PROD) {
  clarity.init(import.meta.env.VITE_APP_CLARITY_ID);
}
