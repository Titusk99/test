const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

/**
 * Wrapper fetch centralisé — ajoute automatiquement le token JWT si présent
 */
const request = async (path, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const err = new Error(data?.message || `Erreur ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
};

export const api = {
  get:    (path, opts = {}) => request(path, { method: 'GET', ...opts }),
  post:   (path, body, opts = {}) => request(path, { method: 'POST', body: JSON.stringify(body), ...opts }),
  put:    (path, body, opts = {}) => request(path, { method: 'PUT', body: JSON.stringify(body), ...opts }),
  patch:  (path, body, opts = {}) => request(path, { method: 'PATCH', body: JSON.stringify(body), ...opts }),
  delete: (path, opts = {}) => request(path, { method: 'DELETE', ...opts }),
};

// Auth
export const authApi = {
  login:    (email, password) => api.post('/auth/login', { email, password }),
  register: (nom, email, password) => api.post('/auth/register', { nom, email, password }),
  logout:   () => api.post('/auth/logout'),
};

// Utilisateurs
export const usersApi = {
  getUser:   (id) => api.get(`/users/${id}`),
  updateUser:(id, data) => api.put(`/users/${id}`, data),
  deleteUser:(id) => api.delete(`/users/${id}`),
};

// Annonces
export const skillsApi = {
  getAll:       (page = 1, limit = 20) => api.get(`/skills?page=${page}&limit=${limit}`),
  getMine:      () => api.get('/skills/me'),
  getOne:       (id) => api.get(`/skills/${id}`),
  create:       (data) => api.post('/skills', data),
  update:       (id, data) => api.put(`/skills/${id}`, data),
  remove:       (id) => api.delete(`/skills/${id}`),
  toggleStatus: (id) => api.patch(`/skills/${id}/statut`, {}),
};

// Matching
export const matchApi = {
  getMatches:         () => api.get('/match'),
  getMatchesForSkill: (skillId) => api.get(`/match/skill/${skillId}`),
  search:             (q) => api.get(`/match/search?q=${encodeURIComponent(q)}`),
};

// Demandes
export const requestsApi = {
  getMine:  () => api.get('/requests'),
  send:     (data) => api.post('/requests', data),
  update:   (id, statut) => api.put(`/requests/${id}`, { statut }),
};

// Messages
export const messagesApi = {
  send:           (request_id, contenu) => api.post('/messages', { request_id, contenu }),
  getConversation:(request_id) => api.get(`/messages/${request_id}`),
};

// Notifications
export const notificationsApi = {
  getMine:    (page = 1) => api.get(`/notifications?page=${page}`),
  markAllRead:() => api.put('/notifications/read'),
  markOneRead:(id) => api.put(`/notifications/${id}/read`),
};

// Favoris
export const favoritesApi = {
  getMine:  () => api.get('/favorites'),
  add:      (skill_id) => api.post('/favorites', { skill_id }),
  remove:   (skill_id) => api.delete(`/favorites/${skill_id}`),
};

// Évaluations
export const ratingsApi = {
  create:     (data) => api.post('/ratings', data),
  getUserRatings:(id) => api.get(`/ratings/user/${id}`),
};

// Statistiques
export const statsApi = {
  global: () => api.get('/stats'),
  mine:   () => api.get('/stats/me'),
};
