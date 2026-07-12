const ActivityModel = require('../models/activity.model');
const EvaluationModel = require('../models/evaluation.model');
const db = require('../config/db'); // Conexión directa a PostgreSQL para resolver ediciones veloces

const ActivityController = {
    getAll: async (req, res) => {
        try {
            const activities = await ActivityModel.findAll();
            res.json(activities);
        } catch (error) {
            res.status(500).json({ error: 'Error al obtener actividades.' });
        }
    },
    create: async (req, res) => {
        const { title, description } = req.body;
        try {
            const newActivity = await ActivityModel.create(title, description);
            res.status(201).json(newActivity);
        } catch (error) {
            res.status(500).json({ error: 'Error al crear actividad.' });
        }
    },
    update: async (req, res) => {
        const { id } = req.params;
        const { title, description } = req.body;
        try {
            const query = `
                UPDATE activities 
                SET title = $1, description = $2 
                WHERE id = $3 
                RETURNING *
            `;
            const { rows } = await db.query(query, [title, description, parseInt(id)]);

            if (rows.length === 0) {
                return res.status(404).json({ error: 'La actividad especificada no existe.' });
            }

            res.json({ message: 'Actividad actualizada con éxito.', updatedActivity: rows[0] });
        } catch (error) {
            console.error('❌ ERROR REAL EN UPDATE_ACTIVITY:', error.message);
            res.status(500).json({ error: 'Error interno en la base de datos al actualizar.' });
        }
    },
    delete: async (req, res) => {
        const { id } = req.params;
        try {
            const query = 'DELETE FROM activities WHERE id = $1 RETURNING *';
            const { rows } = await db.query(query, [parseInt(id)]);

            if (rows.length === 0) {
                return res.status(404).json({ error: 'La actividad seleccionada ya no existe.' });
            }

            res.json({ message: 'Actividad Docente eliminada con éxito.' });
        } catch (error) {
            console.error('❌ ERROR REAL EN DELETE_ACTIVITY:', error.message);
            
            if (error.code === '23503') {
                return res.status(400).json({ error: 'No se puede eliminar la actividad porque ya tiene evaluaciones registradas de tus alumnos.' });
            }
            res.status(500).json({ error: 'Error interno en la base de datos al eliminar.' });
        }
    },
    submitGrade: async (req, res) => {
        const { student_id, activity_id, time_minutes, score_clarity, score_algorithm, score_efficiency, comment } = req.body;
        
        // Validaciones de rangos para la rúbrica (4pts, 4pts, 2pts)
        if (Number(score_clarity) < 0 || Number(score_clarity) > 4) {
            return res.status(400).json({ error: 'La claridad conceptual debe estar entre 0 y 4 puntos.' });
        }
        if (Number(score_algorithm) < 0 || Number(score_algorithm) > 4) {
            return res.status(400).json({ error: 'El funcionamiento del algoritmo debe estar entre 0 y 4 puntos.' });
        }
        if (Number(score_efficiency) < 0 || Number(score_efficiency) > 2) {
            return res.status(400).json({ error: 'La eficiencia de código debe estar entre 0 y 2 puntos.' });
        }

        // Validación de duplicados por combinación Alumno + Actividad
        try {
            const checkQuery = 'SELECT id FROM evaluations WHERE student_id = $1 AND activity_id = $2';
            const checkRes = await db.query(checkQuery, [parseInt(student_id), parseInt(activity_id)]);
            if (checkRes.rows.length > 0) {
                return res.status(400).json({ error: 'Este alumno ya tiene una calificación registrada para esta actividad específica.' });
            }
        } catch (err) {
            console.error('Error al verificar duplicado de evaluación:', err);
        }

        // CORRECCIÓN: El tiempo ahora vale 0 puntos y no influye en la nota final
        const score_time = 0; 
        const final_grade = Math.round(Number(score_clarity) + Number(score_algorithm) + Number(score_efficiency));

        try {
            // Pasamos comment pero recordá que el modelo actual lo ignora de forma segura por ahora
            const evaluation = await EvaluationModel.createEvaluation({
                student_id: parseInt(student_id), 
                activity_id: parseInt(activity_id), 
                time_minutes: parseFloat(time_minutes),
                score_time, 
                score_clarity: parseInt(score_clarity), 
                score_algorithm: parseInt(score_algorithm), 
                score_efficiency: parseInt(score_efficiency), 
                final_grade, 
                comment
            });
            res.json({ message: 'Evaluación guardada con éxito', evaluation });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al registrar la calificación.' });
        }
    },

    getAllEvaluations: async (req, res) => {
        try {
            // SOLUCIÓN TEMPORAL: Cambiamos e.comment por '' AS comment para evitar el Error 42703 que frena el backend
            const query = `
                SELECT 
                    e.id,
                    e.student_id,
                    e.activity_id,
                    REGEXP_REPLACE(CONCAT(s.last_name, ', ', s.first_name), '^Registrado,\\s*', '', 'i') AS student_name,
                    a.title AS activity_title,
                    e.time_minutes,
                    e.score_clarity,
                    e.score_algorithm,
                    e.score_efficiency,
                    e.final_grade,
                    '' AS comment
                FROM evaluations e
                JOIN students s ON e.student_id = s.id
                JOIN activities a ON e.activity_id = a.id
                ORDER BY e.id DESC;
            `;
            const { rows } = await db.query(query);
            res.json(rows);
        } catch (error) {
            console.error('Error al traer historial de notas:', error);
            res.status(500).json({ error: 'Error al recuperar el listado de calificaciones.' });
        }
    },

    updateEvaluation: async (req, res) => {
        const { id } = req.params;
        const { time_minutes, score_clarity, score_algorithm, score_efficiency, comment } = req.body;

        // Validaciones de rangos para la edición de la rúbrica
        if (Number(score_clarity) < 0 || Number(score_clarity) > 4) {
            return res.status(400).json({ error: 'La claridad conceptual debe estar entre 0 y 4 puntos.' });
        }
        if (Number(score_algorithm) < 0 || Number(score_algorithm) > 4) {
            return res.status(400).json({ error: 'El funcionamiento del algoritmo debe estar entre 0 y 4 puntos.' });
        }
        if (Number(score_efficiency) < 0 || Number(score_efficiency) > 2) {
            return res.status(400).json({ error: 'La eficiencia de código debe estar entre 0 y 2 puntos.' });
        }

        const score_time = 0;
        const final_grade = Math.round(Number(score_clarity) + Number(score_algorithm) + Number(score_efficiency));

        try {
            // MODIFICACIÓN TEMPORAL: Quitamos la asignación de comment en el SET para evitar fallos en Render
            const query = `
                UPDATE evaluations
                SET time_minutes = $1, score_time = $2, score_clarity = $3, 
                    score_algorithm = $4, score_efficiency = $5, final_grade = $6
                WHERE id = $7 RETURNING *
            `;
            const { rows } = await db.query(query, [
                parseFloat(time_minutes),
                parseInt(score_time),
                parseInt(score_clarity),
                parseInt(score_algorithm),
                parseInt(score_efficiency),
                parseInt(final_grade),
                parseInt(id)
            ]);

            if (rows.length === 0) {
                return res.status(404).json({ error: 'La calificación no existe.' });
            }
            res.json({ message: 'Calificación actualizada con éxito.', evaluation: rows[0] });
        } catch (error) {
            console.error('❌ ERROR REAL EN UPDATE_EVALUATION:', error.message);
            res.status(500).json({ error: 'Error interno al actualizar la nota.' });
        }
    },

    deleteEvaluation: async (req, res) => {
        const { id } = req.params;
        try {
            const query = 'DELETE FROM evaluations WHERE id = $1 RETURNING *';
            const { rows } = await db.query(query, [parseInt(id)]);

            if (rows.length === 0) {
                return res.status(404).json({ error: 'La calificación ya no existe.' });
            }
            res.json({ message: 'Calificación eliminada correctamente.' });
        } catch (error) {
            console.error('Error al borrar calificación:', error);
            res.status(500).json({ error: 'Error interno al eliminar la nota.' });
        }
    }
};

module.exports = ActivityController;