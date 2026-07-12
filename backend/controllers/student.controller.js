const EvaluationModel = require('../models/evaluation.model');
const db = require('../config/db');
const bcrypt = require('bcryptjs');

const StudentController = {
    getProfileData: async (req, res) => {
        try {
            let studentId = req.params.id;
            
            // Si no viene ID en los parámetros (ruta /current/profile) o el rol es STUDENT, forzamos su propio user_id
            if (!studentId || req.user.role === 'STUDENT') {
                const studentQuery = 'SELECT id FROM students WHERE user_id = $1';
                const { rows } = await db.query(studentQuery, [req.user.id]);
                if (!rows.length) {
                    return res.status(404).json({ error: 'Perfil de estudiante no encontrado.' });
                }
                studentId = rows[0].id;
            }

            const stats = await EvaluationModel.getStudentStats(studentId);
            if (!stats) {
                return res.status(404).json({ error: 'Estudiante no encontrado.' });
            }

            const history = await EvaluationModel.getStudentHistory(studentId);

            res.json({ stats, history });
        } catch (error) {
            console.error('Error al obtener perfil:', error);
            res.status(500).json({ error: 'Error interno del servidor.' });
        }
    },

    getAllStudents: async (req, res) => {
        try {
            const query = `
                SELECT 
                    s.id, 
                    CONCAT(s.first_name, ' ', s.last_name) AS name, 
                    u.username, 
                    u.id as user_id 
                FROM students s 
                JOIN users u ON s.user_id = u.id 
                ORDER BY s.id ASC
            `;
            const { rows } = await db.query(query);
            return res.json(rows);
        } catch (error) {
            console.error('❌ ERROR REAL EN GET_ALL_STUDENTS:', error.message);
            return res.json([]);
        }
    },

    createStudent: async (req, res) => {
        const { name, username, password } = req.body;
        
        const nameParts = name.trim().split(' ');
        const first_name = nameParts[0] || 'Alumno';
        // Quitamos la palabra 'Registrado' por defecto si no ingresa apellido
        const last_name = nameParts.slice(1).join(' ') || '';

        try {
            const checkUser = await db.query('SELECT id FROM users WHERE username = $1', [username]);
            if (checkUser.rows.length > 0) {
                return res.status(400).json({ error: 'El nombre de usuario ya existe.' });
            }

            const courseRes = await db.query('SELECT id FROM courses LIMIT 1');
            if (courseRes.rows.length === 0) {
                return res.status(400).json({ error: 'Debe existir al menos un curso creado en la tabla "courses" antes de registrar alumnos.' });
            }
            const defaultCourseId = courseRes.rows[0].id;

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            await db.query('BEGIN');
            
            const userRes = await db.query(
                'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
                [username, hashedPassword, 'STUDENT']
            );
            const newUserId = userRes.rows[0].id;

            const studentRes = await db.query(
                'INSERT INTO students (user_id, course_id, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id',
                [newUserId, defaultCourseId, first_name, last_name]
            );

            await db.query('COMMIT');

            return res.status(201).json({ 
                id: studentRes.rows[0].id, 
                name: last_name ? `${first_name} ${last_name}` : first_name, 
                username 
            });
        } catch (error) {
            await db.query('ROLLBACK');
            console.error('❌ Error crítico al crear alumno:', error);
            return res.status(500).json({ error: 'Error al registrar el alumno en la base de datos.' });
        }
    },

    updateStudent: async (req, res) => {
        const studentId = req.params.id;
        const { name, username, password } = req.body;

        const nameParts = name.trim().split(' ');
        const first_name = nameParts[0] || 'Alumno';
        // Quitamos la palabra 'Registrado' por defecto si no ingresa apellido
        const last_name = nameParts.slice(1).join(' ') || '';

        try {
            const studentQuery = 'SELECT user_id FROM students WHERE id = $1';
            const { rows } = await db.query(studentQuery, [studentId]);
            if (!rows.length) return res.status(404).json({ error: 'Alumno no encontrado.' });
            const userId = rows[0].user_id;

            await db.query('BEGIN');
            
            await db.query('UPDATE students SET first_name = $1, last_name = $2 WHERE id = $3', [first_name, last_name, studentId]);

            if (password && password.trim() !== "") {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                await db.query('UPDATE users SET username = $1, password_hash = $2 WHERE id = $3', [username, hashedPassword, userId]);
            } else {
                await db.query('UPDATE users SET username = $1 WHERE id = $2', [username, userId]);
            }
            await db.query('COMMIT');

            return res.json({ message: 'Alumno actualizado con éxito.' });
        } catch (error) {
            await db.query('ROLLBACK');
            console.error(error);
            return res.status(500).json({ error: 'Error al actualizar alumno.' });
        }
    },

    deleteStudent: async (req, res) => {
        const studentId = req.params.id;
        try {
            const studentQuery = 'SELECT user_id FROM students WHERE id = $1';
            const { rows } = await db.query(studentQuery, [studentId]);
            if (!rows.length) return res.status(404).json({ error: 'Alumno no encontrado.' });
            const userId = rows[0].user_id;

            await db.query('BEGIN');
            await db.query('DELETE FROM students WHERE id = $1', [studentId]);
            await db.query('DELETE FROM users WHERE id = $1', [userId]);
            await db.query('COMMIT');

            return res.json({ message: 'Alumno eliminado con éxito.' });
        } catch (error) {
            await db.query('ROLLBACK');
            console.error(error);
            return res.status(500).json({ error: 'Error al eliminar alumno.' });
        }
    }
};

module.exports = StudentController;