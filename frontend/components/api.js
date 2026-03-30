const API = 'https://api.v4u.ai';

export const api = async (path, token, options = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.headers) Object.assign(headers, options.headers);
  const res = await fetch(`${API}${path}`, { ...options, headers });
  return res.json();
};

export const apiUpload = async (path, token, formData) => {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return res.json();
};

export const API_URL = API;
