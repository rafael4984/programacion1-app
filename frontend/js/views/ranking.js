import Storage from '../modules/storage.js';

// Configuración de URL dinámica para producción y desarrollo
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://vionex-backend-s34l.onrender.com';

// ==========================================
// 1. CONTROL DE ACCESO E INYECCIÓN INMEDIATA
// ==========================================
const user = Storage.getUser();
const token = Storage.getToken();

// Redirección forzada directa a la pantalla de login dentro de views
if (!user || !token) {
    window.location.href = window.location.origin + '/frontend/views/login.html';
}

// Inicialización de la interfaz una vez que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Inyectar datos del perfil de forma segura sin loops agresivos
    const targetName = user.fullname || user.fullName || user.name || user.nombre || user.username || 'Usuario';
    const navUsername = document.getElementById('nav-username');
    const navAvatarLetter = document.getElementById('nav-avatar-letter');
    
    if (navUsername) navUsername.textContent = targetName;
    if (navAvatarLetter) navAvatarLetter.textContent = targetName.charAt(0).toUpperCase();

    // Mostrar menú de administración si corresponde
    if (user.role === 'ADMIN') {
        const adminItem = document.getElementById('admin-menu-item');
        if (adminItem) adminItem.style.display = 'block';
    }

    // Inicializar componentes interactivos de la vista
    const profileTrigger = document.getElementById('navbar-profile-trigger');
    const logoutMenu = document.getElementById('logout-menu');

    if (profileTrigger && logoutMenu) {
        profileTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            logoutMenu.classList.toggle('show');
        });

        window.addEventListener('click', () => {
            if (logoutMenu.classList.contains('show')) {
                logoutMenu.classList.remove('show');
            }
        });
    }

    // Asignar eventos de cierre de sesión (Sidebar y Navbar unificados)
    const btnLogoutSidebar = document.getElementById('btn-logout-sidebar');
    if (btnLogoutSidebar) {
        btnLogoutSidebar.addEventListener('click', handleLogout);
    }

    const btnLogoutNavbar = document.getElementById('btn-logout-navbar');
    if (btnLogoutNavbar) {
        btnLogoutNavbar.addEventListener('click', handleLogout);
    }

    // Llamar a la API de ranking
    loadRankingData();
});

// Destrucción de sesión unificada con redirección directa a views/login.html
const handleLogout = (e) => {
    e.preventDefault();
    Storage.clear();
    window.location.href = window.location.origin + '/frontend/views/login.html';
};

// ==========================================
// 2. CONSULTA ASÍNCRONA DEL RANKING
// ==========================================
async function loadRankingData() {
    try {
        // Petición adaptada a la URL dinámica del backend
        const response = await fetch(`${API_BASE_URL}/api/ranking`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al responder el servidor');

        const rankingData = await response.json();
        const tbody = document.getElementById('ranking-table-body');
        
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!rankingData || rankingData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Aún no hay calificaciones cargadas en el taller.</td></tr>`;
            return;
        }

        rankingData.forEach((item, index) => {
            const tr = document.createElement('tr');
            const avgScore = item.general_average ? parseFloat(item.general_average) : 0;
            const avgTime = item.average_time ? parseFloat(item.average_time).toFixed(1) : '0.0';
            const hasGrades = (item.activities_count || 0) > 0;

            const maxGradeText = hasGrades && item.max_grade ? parseFloat(item.max_grade).toFixed(1) : 'S/N';
            const minGradeText = hasGrades && item.min_grade ? parseFloat(item.min_grade).toFixed(1) : 'S/N';

            let positionHTML = `<strong>#${index + 1}</strong>`;
            let studentNameStyle = '';
            
            if (index === 0) {
                tr.classList.add('row-gold');
                positionHTML = `<div class="podium-cell text-gold"><img src="../assets/img/medallaoro.png" class="podium-icon" alt="Oro"> 1° Puesto</div>`;
                studentNameStyle = 'class="text-gold"';
            } else if (index === 1) {
                tr.classList.add('row-silver');
                positionHTML = `<div class="podium-cell text-silver"><img src="../assets/img/medallaplata.png" class="podium-icon" alt="Plata"> 2° Puesto</div>`;
                studentNameStyle = 'class="text-silver"';
            } else if (index === 2) {
                tr.classList.add('row-bronze');
                positionHTML = `<div class="podium-cell text-bronze"><img src="../assets/img/medallabronce.png" class="podium-icon" alt="Bronce"> 3° Puesto</div>`;
                studentNameStyle = 'class="text-bronze"';
            }

            let alertClass = '';
            if (index > 2) {
                if (avgScore >= 7) alertClass = `style="color: var(--success, #00ff87); font-weight: bold;"`;
                else if (avgScore >= 4) alertClass = `style="color: var(--warning, #ffaa00);"`;
                else if (avgScore > 0) alertClass = `style="color: var(--danger, #ff4a4a);"`;
            } else {
                alertClass = `class="${index === 0 ? 'text-gold' : index === 1 ? 'text-silver' : 'text-bronze'}" style="font-weight: bold;"`;
            }

            tr.innerHTML = `
                <td>${positionHTML}</td>
                <td ${studentNameStyle}>${item.student_name || 'Alumno no identificado'}</td>
                <td><span style="color: var(--brand-light, #00f0ff); font-weight: 500;">${maxGradeText}</span></td>
                <td><span style="color: var(--text-muted);">${minGradeText}</span></td>
                <td>${item.activities_count || 0}</td>
                <td>${avgTime} min</td>
                <td ${alertClass}>${avgScore > 0 ? avgScore.toFixed(1) : 'S/N'}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Error al renderizar los datos:', error);
        const tbody = document.getElementById('ranking-table-body');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger, #ff4a4a);">Error al conectar con las métricas del servidor.</td></tr>`;
        }
    }
}