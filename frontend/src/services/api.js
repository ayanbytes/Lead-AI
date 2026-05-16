import axios from 'axios';
import { getAccessToken, clearAuth } from '../utils/storage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 120000, // 2 minutes for long analyses
});

// Request interceptor — attach JWT token to every request
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
    if (error.response?.status === 401) {
      clearAuth();
    }
    return Promise.reject(error);
  }
);

export const searchCompanies = async (query) => {
  try {
    const response = await api.post('/api/search-companies', { query });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Search failed');
  }
};

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

export const deleteAudit = async (auditId) => {
  try {
    const response = await api.delete(`/api/audits/${auditId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to delete audit');
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

export const fetchUserSettings = async () => {
  try {
    const response = await api.get('/api/user/settings');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch settings');
  }
};

export const updateUserSettings = async (settings) => {
  try {
    const response = await api.put('/api/user/settings', settings);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to update settings');
  }
};

export const sendEmail = async (emailData) => {
  try {
    const response = await api.post('/api/send-email', {
      to_email: emailData.recipient,
      subject: emailData.subject,
      body: emailData.body
    });
    return response.data;
  } catch (error) {
    let detail = error.response?.data?.detail;
    if (typeof detail === 'object') {
      detail = JSON.stringify(detail);
    }
    throw new Error(detail || 'Failed to send email');
  }
};

export const createRazorpayOrder = async ({ planName, price }) => {
  try {
    const response = await api.post('/api/payment/create-order', {
      plan_name: planName,
      price: String(price)
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to create order');
  }
};

export const verifyRazorpayPayment = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_name }) => {
  try {
    const response = await api.post('/api/payment/verify', {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan_name
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to verify payment');
  }
};

export default api;
