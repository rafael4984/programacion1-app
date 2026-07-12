import Storage from '../modules/storage.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = Storage.getUser();
    const token = Storage.getToken();

    if (!user || user.role !== 'ADMIN') {
        window.location.href = './ranking.html'; 
        return;
    }

    // Configuración de URL dinámica para producción y desarrollo
    const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : 'https://vionex-backend-s34l.onrender.com';

    let localStudentsCache = [];
    let localActivitiesCache = [];
    let localEvaluationsCache = [];

    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn, .tab-content').forEach(el => el.classList.remove('active'));
            tab.classList.add('active');
            const content = document.getElementById(tab.dataset.tab);
            if (content) content.classList.add('active');
        });
    });

    // --- SECCIÓN: ACTIVIDADES (CRUD COMPLETO) ---
    async function renderActivitiesTable(activities) {
        const tbody = document.getElementById('table-activities-body');
        if (!tbody) return;

        if (!activities || activities.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No hay actividades creadas aún.</td></tr>`;
            return;
        }

        tbody.innerHTML = activities.map(act => `
            <tr>
                <td style="font-weight: bold; color: var(--brand-light);">${act.id}</td>
                <td>${act.title}</td>
                <td style="color: var(--text-muted);">${act.description || 'Sin descripción'}</td>
                <td style="text-align: center;">
                    <button class="btn-activity-edit" data-id="${act.id}">✏️</button>
                    <button class="btn-activity-delete" data-id="${act.id}">❌</button>
                </td>
            </tr>
        `).join('');

        document.querySelectorAll('.btn-activity-edit').forEach(btn => {
            btn.addEventListener('click', () => setupEditActivity(btn.dataset.id));
        });
        document.querySelectorAll('.btn-activity-delete').forEach(btn => {
            btn.addEventListener('click', () => executeDeleteActivity(btn.dataset.id));
        });
    }

    async function loadActivitiesSelector() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/activities`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const activities = await response.json();
            localActivitiesCache = activities; 
            
            const select = document.getElementById('select-activity');
            if (select) {
                select.innerHTML = '<option value="">-- Seleccionar Ejercicio --</option>';
                activities.forEach(act => {
                    select.innerHTML += `<option value="${act.id}">${act.title}</option>`;
                });
            }

            await renderActivitiesTable(activities);

        } catch (err) {
            console.error('Error al cargar selector y tabla:', err);
        }
    }
    await loadActivitiesSelector();

    function setupEditActivity(id) {
        const activity = localActivitiesCache.find(a => a.id == id);
        if (!activity) return;

        let idField = document.getElementById('activity-id-field');
        if (!idField) {
            idField = document.createElement('input');
            idField.type = 'hidden';
            idField.id = 'activity-id-field';
            formActivity.appendChild(idField);
        }
        
        idField.value = activity.id;
        document.getElementById('activity-title').value = activity.title;
        document.getElementById('activity-desc').value = activity.description || '';

        const formTitle = document.getElementById('activity-form-title');
        if (formTitle) formTitle.innerText = "Modificar Actividad Práctica";
        
        const submitBtn = document.getElementById('btn-activity-submit') || formActivity.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.id = 'btn-activity-submit';
            submitBtn.innerText = "Actualizar Actividad";
        }

        let cancelBtn = document.getElementById('btn-activity-cancel');
        if (!cancelBtn) {
            cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.id = 'btn-activity-cancel';
            cancelBtn.className = 'btn-secondary'; 
            cancelBtn.innerText = 'Cancelar';
            cancelBtn.style.marginLeft = '10px';
            cancelBtn.addEventListener('click', resetActivityForm);
            
            const targetContainer = formActivity.querySelector('.form-actions') || formActivity;
            targetContainer.appendChild(cancelBtn);
        }
        cancelBtn.style.display = "inline-block";
    }

    function resetActivityForm() {
        const idField = document.getElementById('activity-id-field');
        if (idField) idField.value = "";
        
        if (formActivity) formActivity.reset();

        const formTitle = document.getElementById('activity-form-title');
        if (formTitle) formTitle.innerText = "Crear Nueva Actividad";

        const submitBtn = document.getElementById('btn-activity-submit') || (formActivity ? formActivity.querySelector('button[type="submit"]') : null);
        if (submitBtn) submitBtn.innerText = "Publicar Actividad";

        const cancelBtn = document.getElementById('btn-activity-cancel');
        if (!cancelBtn) return;
        cancelBtn.style.display = "none";
    }

    const formActivity = document.getElementById('form-activity');
    if (formActivity) {
        formActivity.addEventListener('submit', async (e) => {
            e.preventDefault();
            const idField = document.getElementById('activity-id-field');
            const id = idField ? idField.value : "";
            const title = document.getElementById('activity-title').value.trim();
            const description = document.getElementById('activity-desc').value.trim();

            const isEdit = id !== "";
            const url = isEdit ? `${API_BASE_URL}/api/activities/${id}` : `${API_BASE_URL}/api/activities`;
            const method = isEdit ? 'PUT' : 'POST';

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ title, description })
                });
                if (response.ok) {
                    alert(isEdit ? 'Actividad modificada con éxito.' : 'Actividad creada exitosamente.');
                    resetActivityForm();
                    await loadActivitiesSelector(); 
                } else {
                    const errData = await response.json();
                    alert(errData.error || 'Ocurrió un error en la base de datos.');
                }
            } catch (err) { console.error(err); }
        });
    }

    async function executeDeleteActivity(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/activities/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                await loadActivitiesSelector();
            } else {
                const errData = await response.json();
                alert(errData.error || 'No se puede eliminar la actividad si posee notas asignadas.');
            }
        } catch (err) { console.error('Error al borrar actividad:', err); }
    }

    // --- SECCIÓN: GESTIÓN DE ALUMNOS (CRUD) Y CARGA DE SELECTOR ---
    async function loadStudentsTable() {
        const tbody = document.getElementById('table-students-body');
        if (!tbody) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/students`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const students = await response.json();
            localStudentsCache = students;

            const studentSelect = document.getElementById('select-student');
            if (studentSelect) {
                studentSelect.innerHTML = '<option value="">-- Seleccionar Alumno --</option>';
                students.forEach(st => {
                    studentSelect.innerHTML += `<option value="${st.id}">${st.name} (${st.username})</option>`;
                });
            }

            if (students.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No hay alumnos registrados.</td></tr>`;
                return;
            }

            tbody.innerHTML = students.map(student => `
                <tr>
                    <td style="font-weight: bold; color: var(--brand-light);">${student.id}</td>
                    <td>${student.name}</td>
                    <td>${student.username}</td>
                    <td style="text-align: center;">
                        <button class="btn-action-edit" data-id="${student.id}">✏️</button>
                        <button class="btn-action-delete" data-id="${student.id}">❌</button>
                    </td>
                </tr>
            `).join('');

            document.querySelectorAll('.btn-action-edit').forEach(btn => {
                btn.addEventListener('click', () => setupEditStudent(btn.dataset.id));
            });
            document.querySelectorAll('.btn-action-delete').forEach(btn => {
                btn.addEventListener('click', () => executeDeleteStudent(btn.dataset.id));
            });

        } catch (err) {
            console.error('Error al cargar tabla de alumnos:', err);
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--danger);">Error al conectar con el servidor.</td></tr>`;
        }
    }
    await loadStudentsTable();

    function setupEditStudent(id) {
        const student = localStudentsCache.find(s => s.id == id);
        if (!student) return;

        document.getElementById('student-id-field').value = student.id;
        document.getElementById('student-name').value = student.name;
        document.getElementById('student-username').value = student.username;
        document.getElementById('student-password').value = "";
        document.getElementById('student-password').placeholder = "Ingresar solo si desea cambiarla";
        document.getElementById('student-password').required = false;

        document.getElementById('student-form-title').innerText = "Editar Alumno Real";
        document.getElementById('btn-student-submit').innerText = "Actualizar Cambios";
        document.getElementById('btn-student-cancel').style.display = "inline-block";
    }

    function resetStudentForm() {
        document.getElementById('student-id-field').value = "";
        const formStudent = document.getElementById('form-student');
        if (formStudent) formStudent.reset();
        document.getElementById('student-password').placeholder = "";
        document.getElementById('student-password').required = true;

        document.getElementById('student-form-title').innerText = "Registrar Nuevo Alumno";
        document.getElementById('btn-student-submit').innerText = "Guardar Alumno";
        document.getElementById('btn-student-cancel').style.display = "none";
    }

    const btnCancelStudent = document.getElementById('btn-student-cancel');
    if (btnCancelStudent) btnCancelStudent.addEventListener('click', resetStudentForm);

    const formStudent = document.getElementById('form-student');
    if (formStudent) {
        formStudent.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('student-id-field').value;
            const name = document.getElementById('student-name').value.trim();
            const username = document.getElementById('student-username').value.trim();
            const password = document.getElementById('student-password').value;

            const isEdit = id !== "";
            const url = isEdit ? `${API_BASE_URL}/api/students/${id}` : `${API_BASE_URL}/api/students`;
            const method = isEdit ? 'PUT' : 'POST';

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ name, username, password })
                });

                if (response.ok) {
                    alert(isEdit ? 'Alumno actualizado con éxito.' : 'Alumno creado con éxito.');
                    resetStudentForm();
                    await loadStudentsTable();
                } else {
                    const errData = await response.json();
                    alert(errData.error || 'Ocurrió un error en la operation.');
                }
            } catch (err) { console.error(err); }
        });
    }

    async function executeDeleteStudent(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/students/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                await loadStudentsTable();
            }
        } catch (err) { console.error('Error al borrar alumno:', err); }
    }

    // --- SECCIÓN: HISTORIAL Y GESTIÓN DE EVALUACIONES ---
    async function loadEvaluationsTable() {
        const tbody = document.getElementById('table-grades-body');
        if (!tbody) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/activities/evaluations/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const evaluations = await response.json();
            localEvaluationsCache = evaluations;

            if (evaluations.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No hay calificaciones registradas aún.</td></tr>`;
                return;
            }

            tbody.innerHTML = evaluations.map(ev => `
                <tr>
                    <td style="font-weight: 500; color: var(--brand-light);">${ev.student_name}</td>
                    <td>${ev.activity_title}</td>
                    <td style="text-align: center;">${ev.time_minutes}m</td>
                    <td style="text-align: center; font-weight: bold; color: var(--brand-primary);">${ev.final_grade}</td>
                    <td style="color: var(--text-muted); font-size: 0.9rem;">${ev.comment || '-'}</td>
                    <td style="text-align: center;">
                        <button class="btn-grade-edit" data-id="${ev.id}">✏️</button>
                        <button class="btn-grade-delete" data-id="${ev.id}">❌</button>
                    </td>
                </tr>
            `).join('');

            document.querySelectorAll('.btn-grade-edit').forEach(btn => {
                btn.addEventListener('click', () => setupEditGrade(btn.dataset.id));
            });
            document.querySelectorAll('.btn-grade-delete').forEach(btn => {
                btn.addEventListener('click', () => executeDeleteGrade(btn.dataset.id));
            });

        } catch (err) {
            console.error('Error al cargar historial de notas:', err);
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger);">Error al conectar con el servidor.</td></tr>`;
        }
    }
    await loadEvaluationsTable();

    function setupEditGrade(id) {
        const grade = localEvaluationsCache.find(e => e.id == id);
        if (!grade) return;

        document.getElementById('grade-id-field').value = grade.id;
        
        const selectStudent = document.getElementById('select-student');
        selectStudent.value = grade.student_id;
        selectStudent.disabled = true; 

        const selectActivity = document.getElementById('select-activity');
        selectActivity.value = grade.activity_id;
        selectActivity.disabled = true; 

        document.getElementById('input-time').value = grade.time_minutes;
        document.getElementById('score-clarity').value = grade.score_clarity;
        document.getElementById('score-algorithm').value = grade.score_algorithm;
        document.getElementById('score-efficiency').value = grade.score_efficiency;
        document.getElementById('input-comment').value = grade.comment || '';

        document.getElementById('grade-form-title').innerText = "Modificar Calificación Asignada";
        document.getElementById('btn-grade-submit').innerText = "Actualizar Calificación";
        document.getElementById('btn-grade-cancel').style.display = "inline-block";
    }

    function resetGradeForm() {
        document.getElementById('grade-id-field').value = "";
        document.getElementById('select-student').disabled = false;
        document.getElementById('select-activity').disabled = false;
        if (formGrade) formGrade.reset();

        document.getElementById('grade-form-title').innerText = "Cargar Evaluación de Rúbrica";
        document.getElementById('btn-grade-submit').innerText = "Guardar y Calcular Calificación";
        document.getElementById('btn-grade-cancel').style.display = "none";
    }

    const btnCancelGrade = document.getElementById('btn-grade-cancel');
    if (btnCancelGrade) btnCancelGrade.addEventListener('click', resetGradeForm);

    const formGrade = document.getElementById('form-grade');
    if (formGrade) {
        formGrade.addEventListener('submit', async (e) => {
            e.preventDefault();
            const rawId = document.getElementById('grade-id-field').value;
            const isEdit = rawId !== "";
            
            const id = isEdit ? String(rawId).split(':')[0].trim() : "";

            const payload = {
                student_id: parseInt(document.getElementById('select-student').value),
                activity_id: parseInt(document.getElementById('select-activity').value),
                time_minutes: parseFloat(document.getElementById('input-time').value),
                score_clarity: parseInt(document.getElementById('score-clarity').value),
                score_algorithm: parseInt(document.getElementById('score-algorithm').value),
                score_efficiency: parseInt(document.getElementById('score-efficiency').value),
                comment: document.getElementById('input-comment').value.trim()
            };

            const url = isEdit ? `${API_BASE_URL}/api/activities/evaluations/${id}` : `${API_BASE_URL}/api/activities/evaluations`;
            const method = isEdit ? 'PUT' : 'POST';

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });
                if (response.ok) {
                    alert(isEdit ? 'Calificación modificada correctamente.' : 'Nota guardada con éxito.');
                    resetGradeForm();
                    await loadEvaluationsTable();
                } else {
                    const errData = await response.json();
                    alert(errData.error || 'Ocurrió un error al intentar guardar la nota.');
                }
            } catch (err) { console.error(err); }
        });
    }

    async function executeDeleteGrade(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/activities/evaluations/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                await loadEvaluationsTable();
            }
        } catch (err) { console.error('Error al borrar la calificación:', err); }
    }
});