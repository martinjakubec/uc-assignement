import {DefaultApi, Configuration} from '../axios-client';
import axios from 'axios';

export function createApiClient() {
  const apiClient = new DefaultApi(
    new Configuration(),
    import.meta.env.VITE_API_URL,
    axios
  );

  return apiClient;
}
