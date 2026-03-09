const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const pool = new Pool({
    connectionString: 'postgresql://postgres:CeQlayJ5Lhku78EG@db.xtyhmghbmsirmlxsxxut.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

// Initialize table
pool.query(`
  CREATE TABLE IF NOT EXISTS records (
    key TEXT PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Error creating table:', err));

app.post('/api/save', async (req, res) => {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: 'Missing key' });

    try {
        await pool.query(
            `INSERT INTO records (key, value, updated_at) 
       VALUES ($1, $2, CURRENT_TIMESTAMP) 
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
            [key, JSON.stringify(value)] // We store the object as JSONB
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving record:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/load', async (req, res) => {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: 'Missing key' });

    try {
        const result = await pool.query('SELECT value FROM records WHERE key = $1', [key]);
        if (result.rows.length > 0) {
            res.json({ success: true, value: result.rows[0].value });
        } else {
            res.json({ success: true, value: null });
        }
    } catch (error) {
        console.error('Error loading record:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
