const db = require('../config/db');

const UserModel = {
    // Buscar un usuario por su nombre de usuario único (para el Login)
    findByUsername: async (username) => {
        const query = 'SELECT * FROM users WHERE username = $1';
        const { rows } = await db.query(query, [username]);
        return rows[0];
    },

    // Crear un nuevo usuario en el sistema
    create: async (username, passwordHash, role) => {
        const query = `
            INSERT INTO users (username, password_hash, role) 
            VALUES ($1, $2, $3) 
            RETURNING id, username, role, created_at
        `;
        const { rows } = await db.query(query, [username, passwordHash, role]);
        return rows[0];
    }
};

module.exports = UserModel;