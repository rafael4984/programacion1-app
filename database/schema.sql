-- Creación de Tipos Enumerados (Enums para Roles)
CREATE TYPE user_role AS ENUM ('ADMIN', 'STUDENT');

-- 1. Tabla de Cursos
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- Ej: "1ra División", "Año 2026 - Taller I"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Usuarios (Credenciales únicas y roles)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- Almacenará el hash de bcrypt
    role user_role NOT NULL DEFAULT 'STUDENT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Alumnos (Extensión del usuario con rol 'STUDENT')
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(255) NULL, -- Foto opcional
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Actividades Prácticas
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL UNIQUE,
    description TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de Evaluaciones / Resultados
CREATE TABLE IF NOT EXISTS evaluations (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE RESTRICT,
    evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Sub-puntajes de la rúbrica (Restricciones CHECK para garantizar datos reales)
    time_minutes NUMERIC(4,2) NOT NULL CHECK (time_minutes > 0),
    score_time INTEGER NOT NULL CHECK (score_time IN (0, 1)), -- Máximo 1 punto si <= 15 min, sino 0
    score_clarity INTEGER NOT NULL CHECK (score_clarity BETWEEN 0 AND 3),
    score_algorithm INTEGER NOT NULL CHECK (score_algorithm BETWEEN 0 AND 4),
    score_efficiency INTEGER NOT NULL CHECK (score_efficiency BETWEEN 0 AND 2),
    
    -- Nota Final calculada: Almacenada explícitamente para optimizar las consultas de ranking
    final_grade NUMERIC(4,2) NOT NULL CHECK (final_grade BETWEEN 0 AND 10),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Evita que se evalúe al mismo alumno más de una vez en la misma actividad
    CONSTRAINT unique_student_activity UNIQUE (student_id, activity_id)
);

-- Inserción del Administrador permanente (Usuario: 43633237 | Clave original: Rafael4984)
INSERT INTO users (username, password_hash, role)
VALUES ('43633237', '$2a$10$.gGleA8vQkUjY6XpZlGgOuh7H4S7L7e3tN7RbeSgh2RlyK6A9r3Zq', 'ADMIN')
ON CONFLICT (username) DO NOTHING;