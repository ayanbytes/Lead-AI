import axios from 'axios';
import { getAccessToken } from '../utils/storage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 120000, // 2 minutes for long analyses
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const analyzeCompany = async (formData) => {
  try {
    const response = await api.post('/api/analyze', {
      company_name: formData.companyName,
      industry: formData.industry,
      website: formData.website || null,
      include_linkedin: formData.includeLinkedIn || false,
      include_competitors: formData.includeCompetitors || false,
      agency_name: formData.agencyName || null
    });
    
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Analysis failed');
  }
};

export const registerAccount = async ({ fullName, email, password }) => {
  try {
    const response = await api.post('/api/auth/register', {
      full_name: fullName,
      email,
      password
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Registration failed');
  }
};

export const loginAccount = async ({ email, password }) => {
  try {
    const response = await api.post('/api/auth/login', {
      email,
      password
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Login failed');
  }
};

export const fetchMe = async () => {
  try {
    const response = await api.get('/api/auth/me');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch user');
  }
};

export const fetchRecentAudits = async (limit = 10) => {
  try {
    const response = await api.get('/api/audits/recent', { params: { limit } });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch audits');
  }
};

export const fetchAuditById = async (auditId) => {
  try {
    const response = await api.get(`/api/audits/${auditId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch audit');
  }
};

export const fetchAudits = async ({ page = 1, pageSize = 20 } = {}) => {
  try {
    const response = await api.get('/api/audits', { params: { page, page_size: pageSize } });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch audits');
  }
};

export const analyzeBulk = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post('/api/analyze/bulk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 300000, // 5 minutes for bulk processing
    });
    
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Bulk analysis failed');
  }
};

export const downloadPDF = async (result, agencyName) => {
  try {
    const response = await api.post('/api/download/pdf', {
      result: result,
      agency_name: agencyName
    }, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const filename = `${result.company_name.replace(/[^a-z0-9]/gi, '_')}_audit.pdf`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error('PDF download failed');
  }
};

export const exportCSV = async (results) => {
  try {
    const response = await api.post('/api/export/csv', {
      results: results
    }, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const filename = `lead_magnet_results_${Date.now()}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error('CSV export failed');
  }
};

export default api;
