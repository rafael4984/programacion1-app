-- Índice para acelerar el ordenamiento del Ranking General por nota final
CREATE INDEX IF NOT EXISTS idx_evaluations_final_grade ON evaluations(final_grade DESC);

-- Índice compuesto para acelerar las búsquedas del perfil e histórico de un alumno específico
CREATE INDEX IF NOT EXISTS idx_evaluations_student_perf ON evaluations(student_id, evaluation_date);

-- Índice para agilizar la búsqueda de alumnos por nombre/apellido en el panel de administración
CREATE INDEX IF NOT EXISTS idx_students_fullname ON students(last_name, first_name);