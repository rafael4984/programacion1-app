const { Pool } = require('pg');
require('dotenv').config();

// Si existe DATABASE_URL (Producción en Render), la usamos directo con SSL.
// Si no existe, cae en el objeto de configuración local por partes.
const pool = process.env.DATABASE_URL
    ? new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: {
              rejectUnauthorized: false // Obligatorio para que Render no rechace la conexión segura
          }
      })
    : new Pool({
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          database: process.env.DB_NAME || process.env.DB_DATABASE
      });

// Capturar errores inesperados en clientes inactivos
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