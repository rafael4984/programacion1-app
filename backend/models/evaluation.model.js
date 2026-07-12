const db = require('../config/db');

const EvaluationModel = {
    // Obtener los datos consolidados del perfil de un alumno
    getStudentStats: async (studentId) => {
        const query = `
            SELECT 
                s.id AS student_id,
                CONCAT(s.first_name, ' ', s.last_name) AS full_name,
                c.name AS course_name,
                s.avatar_url,
                COUNT(e.id)::INTEGER AS activities_count,
                COALESCE(AVG(e.time_minutes), 0)::NUMERIC(4,1) AS average_time,
                COALESCE(AVG(e.final_grade), 0)::NUMERIC(4,2) AS general_average
            FROM students s
            JOIN courses c ON s.course_id = c.id
            LEFT JOIN evaluations e ON s.id = e.student_id
            WHERE s.id = $1
            GROUP BY s.id, c.name;
        `;
        const { rows } = await db.query(query, [studentId]);
        return rows[0];
    },

    // Obtener el historial completo de actividades de un alumno
    getStudentHistory: async (studentId) => {
        // SOLUCIÓN: Reemplazamos 'e.comment' por un fallback estático para evitar el error 42703 (Missing Column)
        const query = `
            SELECT 
                e.evaluation_date::TEXT AS date,
                a.title AS activity_title,
                e.time_minutes,
                e.score_time,
                e.score_clarity,
                e.score_algorithm,
                e.score_efficiency,
                e.final_grade,
                '' AS comment
            FROM evaluations e
            JOIN activities a ON e.activity_id = a.id
            WHERE e.student_id = $1
            ORDER BY e.evaluation_date DESC, e.id DESC;
        `;
        const { rows } = await db.query(query, [studentId]);
        return rows;
    },

    // Insertar una nueva evaluación o actualizarla si ya existía de forma segura
    createEvaluation: async (data) => {
        const checkQuery = `SELECT id FROM evaluations WHERE student_id = $1 AND activity_id = $2`;
        const checkRes = await db.query(checkQuery, [data.student_id, data.activity_id]);

        if (checkRes.rows.length > 0) {
            // Si ya existe, actualizamos omitiendo la columna comment para evitar fallas en DB
            const updateQuery = `
                UPDATE evaluations SET 
                    time_minutes = $1,
                    score_time = $2,
                    score_clarity = $3,
                    score_algorithm = $4,
                    score_efficiency = $5,
                    final_grade = $6
                WHERE id = $7
                RETURNING *;
            `;
            const updateValues = [
                data.time_minutes,
                data.score_time,
                data.score_clarity,
                data.score_algorithm,
                data.score_efficiency,
                data.final_grade,
                checkRes.rows[0].id
            ];
            const { rows } = await db.query(updateQuery, updateValues);
            return rows[0];
        } else {
            // Si no existe, hacemos un INSERT limpio y directo omitiendo comment
            const insertQuery = `
                INSERT INTO evaluations (
                    student_id, activity_id, time_minutes, 
                    score_time, score_clarity, score_algorithm, score_efficiency, final_grade
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *;
            `;
            const insertValues = [
                data.student_id, 
                data.activity_id, 
                data.time_minutes,
                data.score_time, 
                data.score_clarity, 
                data.score_algorithm, 
                data.score_efficiency, 
                data.final_grade
            ];
            const { rows } = await db.query(insertQuery, insertValues);
            return rows[0];
        }
    }
};

module.exports = EvaluationModel;