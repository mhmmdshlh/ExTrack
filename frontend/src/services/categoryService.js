import api from './api.js';

export const getCategories = () =>
  api.get('/categories');

export const createCategory = (name) =>
  api.post('/categories', { name });

export const updateCategory = (id, name) =>
  api.put(`/categories/${id}`, { name });

export const deleteCategory = (id) =>
  api.delete(`/categories/${id}`);
