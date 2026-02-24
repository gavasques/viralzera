const API_URL = import.meta.env.VITE_API_URL || '';

const getToken = () => localStorage.getItem('token');

const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
};

const createEntityClient = (entityName) => ({
  list: () => apiRequest(`/api/entities/${entityName}`),
  get: (id) => apiRequest(`/api/entities/${entityName}/${id}`),
  create: (data) => apiRequest(`/api/entities/${entityName}`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/api/entities/${entityName}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(`/api/entities/${entityName}/${id}`, {
    method: 'DELETE',
  }),
  filter: (filters) => apiRequest(`/api/entities/${entityName}/filter`, {
    method: 'POST',
    body: JSON.stringify(filters),
  }),
});

const createEntitiesProxy = () => {
  return new Proxy({}, {
    get: (_, entityName) => createEntityClient(entityName),
  });
};

export const neon = {
  entities: createEntitiesProxy(),
  auth: {
    me: async () => {
      const token = getToken();
      if (!token) throw new Error('No token');
      return apiRequest('/api/auth/me');
    },
    login: async (email, password) => {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('token', response.token);
      return response;
    },
    register: async (email, password, name) => {
      const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });
      localStorage.setItem('token', response.token);
      return response;
    },
    updateMe: (data) => apiRequest('/api/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    logout: () => {
      localStorage.removeItem('token');
      window.location.href = '/login';
    },
    redirectToLogin: () => {
      window.location.href = '/login';
    },
  },
  functions: {
    invoke: (name, data) => callFunction(name, data),
  },
  integrations: {
    Core: {
      InvokeLLM: async ({ prompt, response_json_schema, add_context_from_internet }) => {
        const messages = [{ role: 'user', content: prompt }];
        const body = {
          model: 'openai/gpt-4o-mini',
          messages,
          temperature: 0.7,
          max_tokens: 4000,
        };
        if (add_context_from_internet) {
          body.plugins = [{ id: 'web' }];
        }
        const data = await callFunction('openrouter', body);
        return data.choices?.[0]?.message?.content || '';
      },
      SendEmail: async () => { throw new Error('SendEmail not implemented on this server'); },
      UploadFile: async () => { throw new Error('UploadFile not implemented on this server'); },
      GenerateImage: async () => { throw new Error('GenerateImage not implemented on this server'); },
      ExtractDataFromUploadedFile: async () => { throw new Error('ExtractDataFromUploadedFile not implemented on this server'); },
      CreateFileSignedUrl: async () => { throw new Error('CreateFileSignedUrl not implemented on this server'); },
      UploadPrivateFile: async () => { throw new Error('UploadPrivateFile not implemented on this server'); },
    },
  },
  asServiceRole: {
    entities: createEntitiesProxy(),
  },
};

export const callFunction = async (functionName, data) => {
  return apiRequest(`/api/functions/${functionName}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
