import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRoutes from './routes/auth.js';
import expenseRoutes from './routes/expenses.js';
import categoryRoutes from './routes/categories.js';
import settingsRoutes from './routes/settings.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/settings', settingsRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
