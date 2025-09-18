import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
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
    const data = error.response.data as any;
    
    return {
      code: data?.code || `HTTP_${status}`,
      message: data?.message || error.message || 'Server error',
      details: data?.details,
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
    console.log(`Making API request to: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('API success response:', response.data);
    
    // Always return the response as-is to preserve the original API structure
    // Let individual service methods handle their specific response formats
    return response;
  },
  async (error: AxiosError) => {
    console.error('API error:', error);
    
    // Handle retry logic
    const config = error.config as AxiosRequestConfig & { _retryCount?: number };
    
    if (!config._retryCount) {
      config._retryCount = 0;
    }

    if (config._retryCount < DEFAULT_CONFIG.retries) {
      config._retryCount++;
      
      // Wait before retrying with exponential backoff
      const retryDelay = DEFAULT_CONFIG.retryDelay * Math.pow(2, config._retryCount - 1);
      console.log(`Retrying request in ${retryDelay}ms (attempt ${config._retryCount}/${DEFAULT_CONFIG.retries})`);
      
      await delay(retryDelay);
      
      return axiosInstance(config);
    }

    // Transform error to our ApiError format
    const apiError = createApiError(error);
    return Promise.reject(apiError);
  }
);

// Generic request function
const makeRequest = async <T = any>(
  method: string,
  endpoint: string,
  data?: any,
  config?: ApiRequestConfig
): Promise<AxiosResponse<T>> => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  try {
    const response = await axiosInstance.request({
      method: method.toLowerCase() as any,
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
  get: <T = any>(endpoint: string, config?: ApiRequestConfig): Promise<AxiosResponse<T>> => {
    return makeRequest<T>('GET', endpoint, undefined, config);
  },

  // POST request
  post: <T = any>(endpoint: string, data?: any, config?: ApiRequestConfig): Promise<AxiosResponse<T>> => {
    return makeRequest<T>('POST', endpoint, data, config);
  },

  // PUT request
  put: <T = any>(endpoint: string, data?: any, config?: ApiRequestConfig): Promise<AxiosResponse<T>> => {
    return makeRequest<T>('PUT', endpoint, data, config);
  },

  // DELETE request
  delete: <T = any>(endpoint: string, config?: ApiRequestConfig): Promise<AxiosResponse<T>> => {
    return makeRequest<T>('DELETE', endpoint, undefined, config);
  },
};