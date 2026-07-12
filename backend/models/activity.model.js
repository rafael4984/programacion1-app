const db = require('../config/db');

const ActivityModel = {
    findAll: async () => {
        const { rows } = await db.query('SELECT * FROM activities ORDER BY created_at DESC');
        return rows;
    },
    create: async (title, description) => {
        const query = 'INSERT INTO activities (title, description) VALUES ($1, $2) RETURNING *';
        const { rows } = await db.query(query, [title, description]);
        return rows[0];
    }
};

module.exports = ActivityModel;