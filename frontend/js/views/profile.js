import Storage from '../modules/storage.js';

// Configuración de URL dinámica para producción y desarrollo
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://vionex-backend-s34l.onrender.com';

document.addEventListener('DOMContentLoaded', async () => {
    const user = Storage.getUser();
    const token = Storage.getToken();

    if (!user || !token) {
        window.location.href = './login.html';
        return;
    }

    if (user.role === 'ADMIN') {
        document.getElementById('admin-menu-item').style.display = 'block';
    }

    // Función centralizada para destruir la sesión y redirigir al login
    const logoutAction = (e) => {
        e.preventDefault();
        e.stopPropagation();
        Storage.clearSession();
        window.location.href = './login.html';
    };

    // Vinculación de eventos de cierre de sesión (Sidebar y Navbar interactivo)
    document.getElementById('btn-logout-sidebar').addEventListener('click', logoutAction);
    document.getElementById('btn-logout-navbar').addEventListener('click', logoutAction);

    // Lógica para desplegar el menú flotante al hacer click en el usuario del navbar
    const profileTrigger = document.getElementById('navbar-profile-trigger');
    const logoutMenu = document.getElementById('logout-menu');

    profileTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        logoutMenu.classList.toggle('show');
    });

    // Cerrar el menú flotante si hacen click en cualquier otra parte del documento
    document.addEventListener('click', () => {
        logoutMenu.classList.remove('show');
    });

    try {
        // Uso de la URL dinámica para conectar con el perfil del estudiante actual
        const response = await fetch(`${API_BASE_URL}/api/students/current/profile`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al cargar datos del perfil.');

        const data = await response.json();
        
        // Renderizar Datos dinámicos en el Navbar (Nombre Real e Inicial en Mayúscula)
        const fullName = data.stats.full_name || 'Alumno';
        document.getElementById('nav-username').textContent = fullName;
        document.getElementById('nav-avatar-letter').textContent = fullName.charAt(0).toUpperCase();

        // Renderizar Métricas Principales en el cuerpo del perfil
        document.getElementById('student-fullname').textContent = fullName;
        document.getElementById('student-course').textContent = `Curso: ${data.stats.course_name}`;
        document.getElementById('stat-average').textContent = data.stats.general_average > 0 ? data.stats.general_average : 'S/N';
        document.getElementById('stat-count').textContent = data.stats.activities_count;
        document.getElementById('stat-time').textContent = `${data.stats.average_time} min`;

        // Renderizar Historial Rúbrica
        const tbody = document.getElementById('history-table-body');
        tbody.innerHTML = '';

        data.history.forEach(row => {
            const tr = document.createElement('tr');
            const encodedTitle = encodeURIComponent(row.activity_title);

            // Lógica para comentarios largos desplegables
            const fullComment = row.comment || '';
            const isLong = fullComment.length > 60;
            let commentHTML = `<span style="color: var(--text-muted);">Sin comentarios</span>`;

            if (fullComment) {
                if (isLong) {
                    const shortComment = fullComment.substring(0, 57) + '...';
                    commentHTML = `
                        <div class="comment-container">
                            <span class="comment-text">${shortComment}</span>
                            <button class="btn-toggle-comment" style="background: none; border: none; color: var(--brand-light, #00f0ff); cursor: pointer; font-size: 0.85em; padding: 0 0 0 5px; font-weight: 600;">Ver más</button>
                        </div>
                    `;
                } else {
                    commentHTML = `<span>${fullComment}</span>`;
                }
            }

            tr.innerHTML = `
                <td>${row.date}</td>
                <td>
                    <a href="./actividades.html?title=${encodedTitle}" style="color: var(--brand-light, #00f0ff); text-decoration: none; font-weight: 600;">
                        ${row.activity_title} 🔗
                    </a>
                </td>
                <td>${row.time_minutes} min</td>
                <td>
                    <span style="color: var(--text-muted);">
                        (${row.score_clarity}pt / ${row.score_algorithm}pt / ${row.score_efficiency}pt)
                    </span>
                </td>
                <td style="font-weight: bold; color: ${row.final_grade >= 7 ? 'var(--success)' : row.final_grade >= 4 ? 'var(--warning)' : 'var(--danger)'}">
                    ${row.final_grade}
                </td>
                <td style="max-width: 250px; word-break: break-word;">
                    ${row.commentHTML || commentHTML}
                </td>
            `;

            if (fullComment && isLong) {
                const toggleBtn = tr.querySelector('.btn-toggle-comment');
                const textSpan = tr.querySelector('.comment-text');
                
                toggleBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isExpanded = toggleBtn.textContent === 'Ver menos';
                    if (isExpanded) {
                        textSpan.textContent = fullComment.substring(0, 57) + '...';
                        toggleBtn.textContent = 'Ver más';
                    } else {
                        textSpan.textContent = fullComment;
                        toggleBtn.textContent = 'Ver menos';
                    }
                });
            }

            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error(error);
    }
});