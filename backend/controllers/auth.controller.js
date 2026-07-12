const UserModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const AuthController = {
    login: async (req, res) => {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
        }

        try {
            // 1. Buscar el usuario real
            const user = await UserModel.findByUsername(username);
            if (!user) {
                return res.status(401).json({ error: 'Credenciales inválidas.' });
            }

            // 2. Validar la contraseña real con su hash de forma asíncrona
            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
                return res.status(401).json({ error: 'Credenciales inválidas.' });
            }

            // 3. Generar el Token de acceso con firma y expiración de 24 horas
            const token = jwt.sign(
                { id: user.id, role: user.role },
                process.env.JWT_SECRET,
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
            const salt = await bcrypt.genSalt(10);
            const newHash = await bcrypt.hash(newPassword, salt);

            await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);

            res.json({ message: 'Contraseña actualizada exitosamente.' });
        } catch (error) {
            console.error('Error al cambiar la contraseña:', error);
            res.status(500).json({ error: 'Error interno al actualizar la contraseña.' });
        }
    }
};

module.exports = AuthController;