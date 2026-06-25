import { Router } from 'express';
import auth from '../middleware/auth.js';
import sql from '../config/db.js';

const router = Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, categoryId, search, sortBy, sortOrder } = req.query;
    const limit = parseInt(req.query.limit) || 0;
    const offset = parseInt(req.query.offset) || 0;

    let queryText = `
      SELECT e.*, c.name as category_name,
             SUM(e.amount) OVER() as total_amount
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.user_id = $1
    `;
    const params = [req.user.id];
    let idx = 2;

    if (startDate) {
      queryText += ` AND e.created_at >= $${idx++}`;
      params.push(startDate);
    }
    if (endDate) {
      queryText += ` AND e.created_at <= $${idx++}`;
      params.push(endDate);
    }
    if (categoryId) {
      queryText += ` AND e.category_id = $${idx++}`;
      params.push(categoryId);
    }
    if (search) {
      queryText += ` AND (e.title ILIKE $${idx++} OR e.notes ILIKE $${idx++})`;
      params.push(`%${search}%`, `%${search}%`);
    }

    const SORT_MAP = {
      date: 'e.created_at',
      amount: 'e.amount',
      title: 'e.title',
      category: 'c.name',
    };
    const col = SORT_MAP[sortBy] || 'e.created_at';
    const dir = sortOrder === 'asc' ? 'ASC' : 'DESC';
    queryText += ` ORDER BY ${col} ${dir}`;

    if (limit > 0) {
      queryText += ` LIMIT $${idx++}`;
      params.push(limit);
      queryText += ` OFFSET $${idx++}`;
      params.push(offset);
    }

    const rows = await sql(queryText, params);
    const total = rows.length > 0 ? Number(rows[0].total_amount) : 0;

    res.json({
      expenses: rows,
      total,
      hasMore: limit > 0 && rows.length === limit,
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, amount, category_id, notes, created_at } = req.body;

    if (!title || !amount || !category_id) {
      return res.status(400).json({ error: 'Title, amount, and category are required' });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    const [expense] = await sql`
      INSERT INTO expenses (user_id, category_id, title, amount, notes, created_at)
      VALUES (${req.user.id}, ${category_id}, ${title}, ${amount}, ${notes || null}, ${created_at ? new Date(created_at) : new Date()})
      RETURNING *
    `;

    const [cat] = await sql`SELECT name FROM categories WHERE id = ${expense.category_id}`;
    expense.category_name = cat.name;

    res.status(201).json(expense);
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, category_id, notes } = req.body;

    const [existing] = await sql`
      SELECT * FROM expenses WHERE id = ${id} AND user_id = ${req.user.id}
    `;

    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const hoursDiff = (Date.now() - new Date(existing.created_at).getTime()) / (1000 * 60 * 60);
    if (hoursDiff > 24) {
      return res.status(403).json({ error: 'Can only edit expenses within 24 hours' });
    }

    const [updated] = await sql`
      UPDATE expenses
      SET title = ${title || existing.title},
          amount = ${amount || existing.amount},
          category_id = ${category_id || existing.category_id},
          notes = ${notes !== undefined ? notes : existing.notes}
      WHERE id = ${id}
      RETURNING *
    `;

    const [cat] = await sql`SELECT name FROM categories WHERE id = ${updated.category_id}`;
    updated.category_name = cat.name;

    res.json(updated);
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await sql`
      SELECT * FROM expenses WHERE id = ${id} AND user_id = ${req.user.id}
    `;

    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const hoursDiff = (Date.now() - new Date(existing.created_at).getTime()) / (1000 * 60 * 60);
    if (hoursDiff > 24) {
      return res.status(403).json({ error: 'Can only delete expenses within 24 hours' });
    }

    await sql`DELETE FROM expenses WHERE id = ${id}`;
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
