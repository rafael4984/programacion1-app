const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    // Corregido: Cambiado DB_DATABASE por DB_NAME para que coincida exactamente con tu .env
    database: process.env.DB_NAME || process.env.DB_DATABASE 
});

// Capturar errores inesperados en clientes inactivos para que no se caiga el proceso Node
pool.on('error', (err) => {
    console.error('❌ Error inesperado en el pool de clientes de PostgreSQL:', err);
});

// Verificar la conexión inicial al arrancar
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Error crítico al conectar con PostgreSQL:', err.message);
    } else {
        console.log('✅ Conexión a PostgreSQL establecida con éxito.');
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};