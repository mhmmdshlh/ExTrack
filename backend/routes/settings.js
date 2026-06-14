import { Router } from 'express';
import auth from '../middleware/auth.js';
import sql from '../config/db.js';

const router = Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const [settings] = await sql`
      SELECT * FROM user_settings WHERE user_id = ${req.user.id}
    `;

    if (!settings) {
      const [created] = await sql`
        INSERT INTO user_settings (user_id)
        VALUES (${req.user.id})
        RETURNING *
      `;
      return res.json(created);
    }

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/', async (req, res) => {
  try {
    const { cli_template, quick_buttons } = req.body;

    const [updated] = await sql`
      UPDATE user_settings
      SET cli_template = COALESCE(${cli_template}, cli_template),
          quick_buttons = COALESCE(${quick_buttons ? JSON.stringify(quick_buttons) : null}::jsonb, quick_buttons)
      WHERE user_id = ${req.user.id}
      RETURNING *
    `;

    if (!updated) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
