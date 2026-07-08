import api from './api.js';

export const getExpenses = (params, signal) =>
  api.get('/expenses', { params, signal });

export const getExpensesSummary = (params, signal) =>
  api.get('/expenses/summary', { params, signal });

export const createExpense = (data) =>
  api.post('/expenses', data);

export const updateExpense = (id, data) =>
  api.put(`/expenses/${id}`, data);

export const deleteExpense = (id) =>
  api.delete(`/expenses/${id}`);
