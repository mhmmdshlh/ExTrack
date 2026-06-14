import { Router } from 'express';
import auth from '../middleware/auth.js';
import sql from '../config/db.js';

const router = Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const categories = await sql`
      SELECT DISTINCT ON (LOWER(c.name))
        c.*,
        (SELECT COUNT(*) FROM expenses e WHERE e.category_id = c.id)::int as expense_count
      FROM categories c
      WHERE c.user_id IS NULL OR c.user_id = ${req.user.id}
      ORDER BY LOWER(c.name), CASE WHEN c.user_id = ${req.user.id} THEN 0 ELSE 1 END
    `;
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/', async (req, res) => {
  try {
    let { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

    const [existing] = await sql`
      SELECT id FROM categories
      WHERE LOWER(name) = LOWER(${name}) AND (user_id IS NULL OR user_id = ${req.user.id})
    `;

    if (existing) {
      return res.status(409).json({ error: 'Category already exists' });
    }

    const [category] = await sql`
      INSERT INTO categories (name, user_id)
      VALUES (${name}, ${req.user.id})
      RETURNING *
    `;

    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let { name } = req.body;
    name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

    const [category] = await sql`
      UPDATE categories SET name = ${name}
      WHERE id = ${id} AND user_id = ${req.user.id}
      RETURNING *
    `;

    if (!category) {
      return res.status(404).json({ error: 'Category not found or not editable' });
    }

    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [category] = await sql`
      DELETE FROM categories
      WHERE id = ${id} AND user_id = ${req.user.id}
      RETURNING *
    `;

    if (!category) {
      return res.status(404).json({ error: 'Category not found or not deletable' });
    }

    res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
