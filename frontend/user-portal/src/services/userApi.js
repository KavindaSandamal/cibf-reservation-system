import axios from 'axios';

const userApi = axios.create({
  baseURL: process.env.REACT_APP_USER_API,
  headers: { 'Content-Type': 'application/json' },
});

userApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default userApi;
