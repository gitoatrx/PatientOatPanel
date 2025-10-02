import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, Method } from 'axios';
import { ApiResponse, ApiError, ApiRequestConfig } from '@/lib/types/api';
import { API_CONFIG } from '@/lib/config/api';

// API Client Configuration
const DEFAULT_CONFIG: Required<ApiRequestConfig> = {
  timeout: API_CONFIG.REQUEST.TIMEOUT,
  retries: API_CONFIG.REQUEST.RETRIES,
  retryDelay: API_CONFIG.REQUEST.RETRY_DELAY,
  showLoading: true,
  showErrorToast: true,
  showSuccessToast: false,
  skipErrorBoundary: false,
};

// Create Axios instance
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: DEFAULT_CONFIG.timeout,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return instance;
};

// Create the axios instance
const axiosInstance = createAxiosInstance();

// Helper function to delay execution
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Helper function to get error type from status code
const getErrorType = (status: number): ApiError['type'] => {
  if (status >= 400 && status < 500) {
    if (status === 401) return 'authentication';
    if (status === 403) return 'authorization';
    if (status === 404) return 'not_found';
    if (status === 429) return 'rate_limit';
    return 'validation';
  }
  return 'server';
};

// Helper function to create API error
const createApiError = (error: AxiosError): ApiError => {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const data = error.response.data as Record<string, unknown>;
    return {
      code: (data?.code as string) || `HTTP_${status}`,
      message: (data?.message as string) || error.message || 'Server error',
      details: data?.details as Record<string, unknown> | undefined,
      type: getErrorType(status),
    };
  } else if (error.request) {
    // Network error
    return {
      code: 'NETWORK_ERROR',
      message: 'Network error. Please check your connection.',
      type: 'network',
    };
  } else {
    // Other error
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      type: 'server',
    };
  }
};

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {

    return config;
  },
  (error) => {

    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {

    // Always return the response as-is to preserve the original API structure
    // Let individual service methods handle their specific response formats
    return response;
  },
  async (error: AxiosError) => {

    // Handle retry logic
    const config = error.config as AxiosRequestConfig & { _retryCount?: number };
    
    if (!config._retryCount) {
      config._retryCount = 0;
    }

    if (config._retryCount < DEFAULT_CONFIG.retries) {
      config._retryCount++;
      
      // Wait before retrying with exponential backoff
      const retryDelay = DEFAULT_CONFIG.retryDelay * Math.pow(2, config._retryCount - 1);

      await delay(retryDelay);
      
      return axiosInstance(config);
    }

    // Transform error to our ApiError format
    const apiError = createApiError(error);
    return Promise.reject(apiError);
  }
);

// Generic request function
const makeRequest = async <T = unknown>(
  method: string,
  endpoint: string,
  data?: unknown,
  config?: ApiRequestConfig
): Promise<AxiosResponse<T>> => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  try {
    const response = await axiosInstance.request({
      method: method.toLowerCase() as Method,
      url: endpoint,
      data,
      timeout: finalConfig.timeout,
    });

    return response;
  } catch (error) {
    // Error is already transformed by the response interceptor
    throw error;
  }
};

// API Client functions
export const apiClient = {
  // Set authentication token
  setAuthToken: (token: string) => {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  // Remove authentication token
  clearAuthToken: () => {
    delete axiosInstance.defaults.headers.common['Authorization'];
  },

  // GET request
  get: <T = unknown>(endpoint: string, config?: ApiRequestConfig): Promise<AxiosResponse<T>> => {
    return makeRequest<T>('GET', endpoint, undefined, config);
  },

  // POST request
  post: <T = unknown>(endpoint: string, data?: unknown, config?: ApiRequestConfig): Promise<AxiosResponse<T>> => {
    return makeRequest<T>('POST', endpoint, data, config);
  },

  // PUT request
  put: <T = unknown>(endpoint: string, data?: unknown, config?: ApiRequestConfig): Promise<AxiosResponse<T>> => {
    return makeRequest<T>('PUT', endpoint, data, config);
  },

  // DELETE request
  delete: <T = unknown>(endpoint: string, config?: ApiRequestConfig): Promise<AxiosResponse<T>> => {
    return makeRequest<T>('DELETE', endpoint, undefined, config);
  },
};