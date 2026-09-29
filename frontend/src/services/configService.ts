import { request } from './apiClient';
import { ConfigStatusResponse } from '../types/config';

/**
 * Service for system diagnostics and backend configuration status.
 */
export const configService = {
  /** Fetch backend configuration status */
  async getStatus(): Promise<ConfigStatusResponse> {
    return request<ConfigStatusResponse>('/config/status');
  },
};
