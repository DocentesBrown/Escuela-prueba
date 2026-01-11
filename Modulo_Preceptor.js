// ============================================================================
// ARCHIVO: Modulo_Preceptor.js
// ============================================================================

async function iniciarModuloPreceptor() {
    const contenedor = document.getElementById('contenido-dinamico');
    contenedor.innerHTML = `
        <div class="mb-4"><h3>Hola, ${usuarioActual.nombre} 👋</h3><p class="text-muted">Selecciona un curso.</p></div>
        <div id="lista-cursos-preceptor" class="row g-3"><div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div></div>`;

    try {
        const resp = await fetch(`${URL_API}?op=getCursosDisponibles&rol=Preceptor`);
        const json = await resp.json();
        const divCursos = document.getElementById('lista-cursos-preceptor');
        divCursos.innerHTML = ''; 

        if (json.status === 'success' && json.data.length > 0) {
            const misCursos = (usuarioActual.cursos || "").split(',').map(c => c.trim());
            const propios = [], otros = [];
            json.data.forEach(c => misCursos.includes(c) ? propios.push(c) : otros.push(c));

            if (propios.length > 0) {
                divCursos.innerHTML += `<div class="col-12 mt-2"><h6 class="text-primary fw-bold border-bottom pb-2">⭐ Mis Cursos</h6></div>`;
                propios.forEach(c => divCursos.innerHTML += `<div class="col-6 col-md-4 col-lg-3"><button class="btn btn-primary w-100 py-4 shadow-sm fw-bold fs-5" onclick="cargarAsistencia('${c}')">${c}</button></div>`);
            }
            if (otros.length > 0) {
                divCursos.innerHTML += `<div class="col-12 mt-5"><h6 class="text-muted border-bottom pb-2">📂 Otros Cursos</h6></div>`;
                otros.forEach(c => divCursos.innerHTML += `<div class="col-6 col-md-4 col-lg-3"><button class="btn btn-outline-secondary w-100 py-2" onclick="cargarAsistencia('${c}')">${c}</button></div>`);
            }
        } else divCursos.innerHTML = '<div class="alert alert-warning">No hay cursos.</div>';
    } catch (e) { console.error(e); }
}

async function cargarAsistencia(curso) {
    document.getElementById('contenido-dinamico').innerHTML = `<div class="spinner-border text-primary"></div> Cargando ${curso}...`;
    const fechaHoy = new Date().toISOString().split('T')[0];
    document.getElementById('contenido-dinamico').innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h3>Curso: ${curso}</h3>
            <div class="d-flex align-items-center">
                <input type="date" id="fechaAsistencia" class="form-control me-2" value="${fechaHoy}">
                <button class="btn btn-warning" onclick="iniciarModuloPreceptor()">Volver</button>
            </div>
        </div>
        <input type="hidden" id="selCurso" value="${curso}">
        <div id="zonaPreceptor"><div class="spinner-border text-primary"></div> Obteniendo listado...</div>
        ${renderModalJustificacionHTML()}
    `;
    
    try {
        const resp = await fetch(`${URL_API}?op=getDataPreceptor&rol=Preceptor`);
        const json = await resp.json();
        baseDatosAlumnos = json.data; 
        renderTablaPreceptor();
    } catch(e) { alert("Error cargando alumnos"); }
}

function renderTablaPreceptor() {
    const cursoSeleccionado = document.getElementById('selCurso').value;
    
    // Normalizamos el curso seleccionado (quitamos espacios extra)
    const cursoClean = String(cursoSeleccionado).trim().toUpperCase();

    // Filtramos alumnos comparando texto limpio
    // obj.data[2] es la columna CURSO que viene del Excel
    const lista = baseDatosAlumnos.filter(obj => {
        const cursoAlumno = String(obj.data[2] || "").trim().toUpperCase();
        return cursoAlumno === cursoClean;
    });

    // Ordenamos alfabéticamente
    lista.sort((a,b) => String(a.data[1]).localeCompare(b.data[1]));
    
    if(lista.length === 0) {
        document.getElementById('zonaPreceptor').innerHTML = `
            <div class="alert alert-warning text-center">
                <h5>⚠️ No se encontraron alumnos en ${cursoSeleccionado}</h5>
                <p class="mb-0 small">Posibles causas:</p>
                <ul class="text-start d-inline-block small text-muted">
                    <li>El Directivo aún no asignó el curso en la "Gestión de Estudiantes".</li>
                    <li>El nombre del curso tiene un error de escritura.</li>
                </ul>
            </div>`;
        return;
    }

    let html = `<div class="card shadow-sm"><table class="table align-middle table-striped mb-0 text-center"><thead class="table-dark"><tr>
        <th class="text-start">Estudiante</th><th title="Faltas">F</th><th style="background:#d4edda; color:green;">P</th><th style="background:#f8d7da; color:red;">A</th><th style="background:#fff3cd; color:#856404;">T</th><th style="background:#e2e3e5; color:#383d41;">EF</th><th>Acción</th>
        </tr></thead><tbody>`;
    
    lista.forEach(item => {
        const alu = item.data; 
        const st = item.stats; 
        
        // Formato de faltas
        let total = parseFloat(st.total);
        let totalStr = Number.isInteger(total) ? total : total.toFixed(2).replace('.00','');
        let alerta = total >= 10 ? `<span class="badge bg-danger ms-2">⚠️ ${totalStr}</span>` : (total > 0 ? `<span class="badge bg-light text-dark border ms-2">${totalStr}</span>` : "");

        html += `<tr>
            <td class="text-start fw-bold">${alu[1]} ${alerta}</td>
            <td><small>${totalStr}</small></td>
            <td style="background:#d4edda;"><input type="radio" name="e_${alu[0]}" value="P" checked style="transform: scale(1.3);"></td>
            <td style="background:#f8d7da;"><input type="radio" name="e_${alu[0]}" value="A" style="transform: scale(1.3);"></td>
            <td style="background:#fff3cd;"><input type="radio" name="e_${alu[0]}" value="T" style="transform: scale(1.3);"></td>
            <td style="background:#e2e3e5;"><input type="radio" name="e_${alu[0]}" value="EF" style="transform: scale(1.3);"></td>
            <td><button class="btn btn-sm btn-outline-primary" onclick="abrirModalJustificar('${alu[0]}', '${alu[1]}')">⚖️</button></td>
        </tr>`;
    });
    html += `</tbody></table><div class="p-3 bg-light border-top"><button onclick="guardarAsis()" class="btn btn-success w-100 btn-lg shadow">✅ Guardar Asistencia</button></div></div>`;
    document.getElementById('zonaPreceptor').innerHTML = html;
}

async function guardarAsis() {
    const inputs = document.querySelectorAll('input[type="radio"]:checked');
    const fecha = document.getElementById('fechaAsistencia').value;
    if (!fecha) return alert("Selecciona fecha.");
    let lista = [];
    inputs.forEach(inp => lista.push({ dni: inp.name.split('_')[1], estado: inp.value }));
    try {
        await fetch(URL_API, { method: 'POST', body: JSON.stringify({ op: 'guardarAsistenciaMasiva', lista: lista, preceptor: usuarioActual.nombre, fecha: fecha })});
        alert(`¡Asistencia del ${fecha} guardada!`);
        iniciarModuloPreceptor();
    } catch(e) { alert("Error al guardar."); }
}

async function abrirModalJustificar(dni, nombre) {
    document.getElementById('just_nombre').innerText = nombre;
    document.getElementById('just_lista').innerHTML = '<div class="spinner-border spinner-border-sm"></div> Buscando faltas...';
    new bootstrap.Modal(document.getElementById('modalJustificar')).show();
    try {
        const resp = await fetch(`${URL_API}?op=getHistorialAlumno&rol=Preceptor&dni=${dni}`);
        const json = await resp.json();
        let html = `<ul class="list-group">`;
        if(json.data.length === 0) html = '<div class="alert alert-success">Sin faltas injustificadas.</div>';
        else {
            json.data.forEach(item => {
                let badge = item.estado === 'A' ? '<span class="badge bg-danger">Ausente</span>' : (item.estado === 'T' ? '<span class="badge bg-warning text-dark">Tarde</span>' : '<span class="badge bg-secondary">EF</span>');
                html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                    <div><strong>${item.fecha}</strong> ${badge}</div>
                    <button class="btn btn-sm btn-outline-success" onclick="confirmarJustificacion(${item.fila}, '${dni}')">Justificar ✅</button>
                </li>`;
            });
            html += `</ul>`;
        }
        document.getElementById('just_lista').innerHTML = html;
    } catch(e) { document.getElementById('just_lista').innerHTML = "Error."; }
}

async function confirmarJustificacion(fila, dni) {
    if(!confirm("¿Confirmar justificación?")) return;
    try {
        await fetch(URL_API, { method: 'POST', body: JSON.stringify({ op: 'justificarFalta', fila: fila })});
        alert("Justificada.");
        bootstrap.Modal.getInstance(document.getElementById('modalJustificar')).hide();
    } catch(e) { alert("Error."); }
}

async function verContactosDocentes() {
    const cont = document.getElementById('contenido-dinamico');
    cont.innerHTML = '<div class="spinner-border text-info"></div> Cargando Directorio...';
    try {
        const resp = await fetch(`${URL_API}?op=getDocentes&rol=Preceptor`);
        const json = await resp.json();
        if (json.status !== 'success') return cont.innerHTML = '<p class="text-danger">Error de permisos.</p>';

        let html = `
            <h5 class="mb-3">📞 Directorio de Docentes</h5>
            <div class="input-group mb-3"><span class="input-group-text">🔍</span><input type="text" class="form-control" id="buscadorContactos" placeholder="Buscar..." onkeyup="filtrarContactos()"></div>
            <div class="table-responsive bg-white rounded shadow-sm"><table class="table table-hover table-striped mb-0 align-middle"><thead class="table-dark"><tr><th>Docente</th><th>Email</th><th>Contacto Rápido</th></tr></thead><tbody id="tbodyContactos">`;
        
        json.data.forEach(d => {
            let cel = d[3] ? d[3].toString().replace(/[^0-9]/g, '') : '';
            let btnWsp = cel.length > 6 ? `<a href="https://wa.me/549${cel}" target="_blank" class="btn btn-success btn-sm text-white">📱 WhatsApp</a>` : `<span class="text-muted small">Sin celular</span>`;
            html += `<tr class="fila-contacto" data-nombre="${d[1].toLowerCase()}" data-email="${d[2].toLowerCase()}"><td class="fw-bold">${d[1]}</td><td><a href="mailto:${d[2]}">${d[2]}</a></td><td>${btnWsp}</td></tr>`;
        });
        html += `</tbody></table></div>`;
        cont.innerHTML = html;
    } catch (e) { cont.innerHTML = '<p class="text-danger">Error.</p>'; }
}

function filtrarContactos() {
    const q = document.getElementById('buscadorContactos').value.toLowerCase();
    document.querySelectorAll('.fila-contacto').forEach(row => {
        row.style.display = (row.dataset.nombre.includes(q) || row.dataset.email.includes(q)) ? '' : 'none';
    });
}
