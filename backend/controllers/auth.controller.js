const UserModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const AuthController = {
    login: async (req, res) => {
        // Sanitización absoluta: Forzamos strings y barremos cualquier espacio invisible
        const username = req.body.username ? String(req.body.username).trim() : '';
        const password = req.body.password ? String(req.body.password).trim() : '';

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
        }

        try {
            // ====== MENTAL MODEL: DEBUG DE EMERGENCIA EN RENDER ======
            const saltEmergencia = await bcrypt.genSalt(10);
            const hashNativo = await bcrypt.hash(password, saltEmergencia);
            console.log("==================================================");
            console.log("🔑 HASH REAL GENERADO POR TU BACKEND EN RENDER:", hashNativo);
            console.log(`👤 Datos recibidos del Login Form -> Usuario: "${username}" | Clave enviada: "${password}"`);
            console.log("==================================================");
            // =========================================================

            // 1. Buscar el usuario real
            const user = await UserModel.findByUsername(username);
            
            if (!user) {
                console.log(`❌ El usuario "${username}" NO existe en la base de datos.`);
                return res.status(401).json({ error: 'Credenciales inválidas.' });
            }

            // Aplicamos un .trim() preventivo también al hash recuperado de la base de datos
            const storedHash = user.password_hash ? user.password_hash.trim() : '';
            console.log(`🔍 Usuario encontrado: ID: ${user.id} | Hash en DB: ${storedHash}`);

            // 2. Validar la contraseña real con su hash limpio
            const validPassword = await bcrypt.compare(password, storedHash);
            
            if (!validPassword) {
                console.log(`❌ La contraseña enviada no coincide con el hash de la base de datos.`);
                return res.status(401).json({ error: 'Credenciales inválidas.' });
            }

            // 3. Generar el Token de acceso con firma y expiración de 24 horas
            const secret = process.env.JWT_SECRET || 'vionex_secret_fallback_key_2026';
            const token = jwt.sign(
                { id: user.id, role: user.role },
                secret,
                { expiresIn: '24h' }
            );

            // 4. Responder con los datos estrictamente necesarios para el Frontend
            res.json({
                message: 'Autenticación exitosa',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });

        } catch (error) {
            console.error('Error en el proceso de Login:', error);
            res.status(500).json({ error: 'Error interno del servidor.' });
        }
    },

    // Permite a un usuario logueado actualizar su contraseña de forma segura
    changePassword: async (req, res) => {
        const { newPassword } = req.body;
        const userId = req.user.id; // Obtenido del token JWT a través del middleware

        if (!newPassword || newPassword.trim().length < 4) {
            return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 4 caracteres.' });
        }

        try {
            const cleanPassword = newPassword.trim();
            const salt = await bcrypt.genSalt(10);
            const newHash = await bcrypt.hash(cleanPassword, salt);

            await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);

            res.json({ message: 'Contraseña actualizada exitosamente.' });
        } catch (error) {
            console.error('Error al cambiar la contraseña:', error);
            res.status(500).json({ error: 'Error interno al actualizar la contraseña.' });
        }
    }
};

module.exports = AuthController;