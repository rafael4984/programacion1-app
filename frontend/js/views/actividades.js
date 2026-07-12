import Storage from '../modules/storage.js';

// Configuración de URL dinámica para producción y desarrollo
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://vionex-backend-s34l.onrender.com';

document.addEventListener('DOMContentLoaded', async () => {
    const token = Storage.getToken();
    const user = Storage.getUser();

    // 1. Redirección de seguridad si el usuario no inició sesión
    if (!token || !user) {
        window.location.href = './login.html'; 
        return;
    }

    // 2. Control estricto de visibilidad para el botón de Administración
    if (user.role === 'ADMIN') {
        document.getElementById('admin-menu-item').style.display = 'block';
    }

    // 3. Función centralizada para destruir la sesión y redirigir al login
    const logoutAction = (e) => {
        e.preventDefault();
        e.stopPropagation();
        Storage.clearSession();
        window.location.href = './login.html';
    };

    // Vinculación de eventos de cierre de sesión (Sidebar y Navbar interactivo)
    document.getElementById('btn-logout-sidebar').addEventListener('click', logoutAction);
    document.getElementById('btn-logout-navbar').addEventListener('click', logoutAction);

    // 4. Lógica para desplegar el menú flotante al hacer click en el usuario del navbar
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

    // 5. Intentar rellenar datos básicos del usuario del SessionStorage mientras responde la API del perfil si fuera necesario
    const navUsername = document.getElementById('nav-username');
    const navAvatarLetter = document.getElementById('nav-avatar-letter');
    
    if (navUsername) {
        const fallbackName = user.name || user.nombre || user.fullName || user.username || 'Alumno';
        navUsername.textContent = fallbackName;
        if (navAvatarLetter) {
            navAvatarLetter.textContent = fallbackName.charAt(0).toUpperCase();
        }
    }

    // 6. Lógica para cargar las actividades desde la API
    const gridContainer = document.getElementById('activities-grid-container');

    if (!gridContainer) return;

    try {
        // Aprovechamos la llamada inicial para actualizar el nombre real del navbar desde la base de datos si corresponde
        const profileResponse = await fetch(`${API_BASE_URL}/api/students/current/profile`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            const realFullName = profileData.stats.full_name || user.name;
            navUsername.textContent = realFullName;
            navAvatarLetter.textContent = realFullName.charAt(0).toUpperCase();
        }

        // Llamada a la API de actividades utilizando la URL dinámica
        const response = await fetch(`${API_BASE_URL}/api/activities`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('No se pudo obtener el listado de actividades.');
        }

        const activities = await response.json();

        if (!activities || activities.length === 0) {
            gridContainer.innerHTML = `
                <div class="no-activities">
                    <p>No hay actividades prácticas asignadas en este momento.</p>
                </div>`;
            return;
        }

        // 7. Renderizamos las tarjetas dinámicamente evaluando el largo del texto
        const MAX_LENGTH = 150; // Cantidad máxima de caracteres visibles inicialmente

        gridContainer.innerHTML = activities.map(act => {
            const fullDescription = act.description || 'Sin descripción detallada asignada.';
            const isLongText = fullDescription.length > MAX_LENGTH;
            
            // Si es largo, recortamos el texto inicial
            const shortDescription = isLongText 
                ? fullDescription.substring(0, MAX_LENGTH) + '...' 
                : fullDescription;

            return `
                <div class="activity-card" data-title="${escapeHTML(act.title)}">
                    <div>
                        <div class="activity-id">Ejercicio # ${act.id}</div>
                        <h3 class="activity-title">${escapeHTML(act.title)}</h3>
                        
                        <p class="activity-desc" 
                            data-short="${escapeHTML(shortDescription)}" 
                            data-full="${escapeHTML(fullDescription)}" 
                            data-expanded="false">${escapeHTML(shortDescription)}</p>
                        
                        ${isLongText ? `
                            <button class="btn-toggle-text" style="
                                background: none; 
                                border: none; 
                                color: var(--brand-light, #00f0ff); 
                                cursor: pointer; 
                                padding: 0; 
                                font-size: 0.85rem; 
                                font-weight: 500; 
                                margin-top: 8px; 
                                text-align: left;
                                text-decoration: underline;
                            ">Ver más</button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Redirección inteligente e iluminación del ejercicio cliqueado en Perfil
        const urlParams = new URLSearchParams(window.location.search);
        const targetTitle = urlParams.get('title');

        if (targetTitle) {
            const matchedCard = Array.from(document.querySelectorAll('.activity-card')).find(
                card => card.getAttribute('data-title') === targetTitle
            );

            if (matchedCard) {
                setTimeout(() => {
                    matchedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    matchedCard.style.borderColor = 'var(--brand-light, #00f0ff)';
                    matchedCard.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.4)';
                }, 300);
            }
        }

        // 8. Manejador de eventos dinámico para alternar los textos (Expandir / Contraer)
        gridContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-toggle-text')) {
                const btn = e.target;
                const textParagraph = btn.previousElementSibling; 
                
                if (textParagraph && textParagraph.classList.contains('activity-desc')) {
                    const isExpanded = textParagraph.getAttribute('data-expanded') === 'true';
                    
                    if (isExpanded) {
                        textParagraph.textContent = textParagraph.getAttribute('data-short');
                        textParagraph.setAttribute('data-expanded', 'false');
                        btn.textContent = 'Ver más';
                    } else {
                        textParagraph.textContent = textParagraph.getAttribute('data-full');
                        textParagraph.setAttribute('data-expanded', 'true');
                        btn.textContent = 'Ver menos';
                    }
                }
            }
        });

    } catch (err) {
        console.error('Error al renderizar la ventana de actividades:', err);
        gridContainer.innerHTML = `
            <div class="no-activities" style="border-color: var(--danger, #ff4a4a);">
                <p style="color: var(--danger, #ff4a4a);">Error al conectar con el servidor. Intente nuevamente en unos minutos.</p>
            </div>`;
    }
});

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}