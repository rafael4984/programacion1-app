const db = require('../config/db');

const StudentModel = {
    // Obtener el ranking general calculado y ordenado automáticamente
    getRanking: async () => {
        const query = `
            SELECT 
                s.id AS student_id,
                -- Limpiamos el prefijo 'Registrado, ' si existe en el campo concatenado
                REGEXP_REPLACE(CONCAT(s.last_name, ', ', s.first_name), '^Registrado,\\s*', '', 'i') AS student_name,
                COUNT(e.id)::INTEGER AS activities_count,
                COALESCE(AVG(e.time_minutes), 0)::NUMERIC(4,1) AS average_time,
                -- CORREGIDO: AVG ignora los nulos nativamente. Coalesce por fuera para alumnos sin notas cargadas.
                COALESCE(AVG(e.final_grade), 0)::NUMERIC(4,1) AS general_average,
                -- Agregamos las métricas extremas solicitadas (nota máxima y mínima)
                COALESCE(MAX(e.final_grade), 0)::NUMERIC(4,1) AS max_grade,
                COALESCE(MIN(e.final_grade), 0)::NUMERIC(4,1) AS min_grade
            FROM students s
            LEFT JOIN evaluations e ON s.id = e.student_id
            GROUP BY s.id, s.last_name, s.first_name
            -- Se ordena por promedio real omitiendo distorsiones de ceros estructurales
            ORDER BY general_average DESC, activities_count DESC;
        `;
        const { rows } = await db.query(query);
        return rows;
    }
};

module.exports = StudentModel;