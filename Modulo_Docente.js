// ============================================================================
// ARCHIVO: Modulo_Docente.js
// ============================================================================

async function iniciarModuloDocente() {
    document.getElementById('contenido-dinamico').innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-2">Cargando cursos asignados...</p></div>`;
    
    try {
        const resp = await fetch(`${URL_API}?op=getCursosDocente&rol=Docente&dni=${usuarioActual.dni || ''}`);
        const json = await resp.json();
        
        if (json.status !== 'success' || !json.data) {
            document.getElementById('contenido-dinamico').innerHTML = `<div class="alert alert-warning"><h5>No tienes cursos asignados</h5><p>Contacta al directivo.</p></div>`;
            return;
        }
        
        let html = `<h4 class="mb-3">🏫 Mis Cursos</h4><div class="row" id="lista-cursos">`;
        json.data.forEach(cursoData => {
            html += `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="card h-100 shadow-sm border-0 border-start border-4 border-primary">
                    <div class="card-body">
                        <h5 class="card-title fw-bold text-primary">${cursoData.curso}</h5>
                        <p class="text-muted small mb-3"><i class="bi bi-people"></i> ${cursoData.totalEstudiantes} estudiantes</p>
                        <hr>
                        <ul class="list-unstyled">`;
            cursoData.materias.forEach(m => {
                html += `<li class="mb-2"><button class="btn btn-outline-dark w-100 text-start d-flex justify-content-between align-items-center" onclick="abrirCursoDocente('${cursoData.curso}', '${m.id}', '${m.nombre}')"><span>📚 ${m.nombre}</span> <span class="badge bg-light text-dark border">${m.tipoAsignacion}</span></button></li>`;
            });
            html += `</ul></div></div></div>`;
        });
        html += `</div>`;
        
        html += renderModalJustificarDocenteHTML();
        document.getElementById('contenido-dinamico').innerHTML = html;
        
    } catch (e) { document.getElementById('contenido-dinamico').innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`; }
}

let fechaAsistenciaSeleccionada = new Date().toISOString().split('T')[0];

async function abrirCursoDocente(curso, idMateria, nombreMateria) {
    document.getElementById('contenido-dinamico').innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-2">Cargando datos...</p></div>`;
    
    try {
        // Enrolamos los parámetros exactos que espera el Backend actualizado
        const url = `${URL_API}?op=getEstudiantesConDatosCompletos&rol=Docente&dniDocente=${usuarioActual.dni}&curso=${curso}&idMateria=${idMateria}`;
        const resp = await fetch(url);
        const json = await resp.json();
        
        if (json.status !== 'success') throw new Error(json.message);
        
        window.cursoActualDocente = { curso, idMateria, nombreMateria, estudiantes: json.data.estudiantes };  
        
        let html = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div><h4 class="mb-0 fw-bold text-primary">${nombreMateria} <span class="text-muted fw-normal fs-6">(${curso})</span></h4></div>
                <button class="btn btn-secondary btn-sm" onclick="iniciarModuloDocente()">← Volver</button>
            </div>

            <div class="card shadow-sm mb-4">
                <div class="card-header bg-white">
                    <ul class="nav nav-pills card-header-pills" id="tabsDocente">
                        <li class="nav-item"><button class="nav-link active" onclick="mostrarTabDocente('asistencia', this)">📅 Asistencia</button></li>
                        <li class="nav-item"><button class="nav-link" onclick="mostrarTabDocente('notas', this)">📊 Calificaciones</button></li>
                        <li class="nav-item"><button class="nav-link" onclick="mostrarTabDocente('resumen', this)">📈 Resumen</button></li>
                    </ul>
                </div>
                <div class="card-body">
                    <div id="tabAsistencia">
                        <div class="row mb-3 align-items-end bg-light p-3 rounded">
                            <div class="col-md-4">
                                <label class="fw-bold small">Fecha de toma:</label>
                                <input type="date" id="fechaAsistenciaPicker" class="form-control" value="${fechaAsistenciaSeleccionada}" onchange="cambiarFechaAsistencia(this.value)">
                            </div>
                            <div class="col-md-8 text-end">
                                <button class="btn btn-success" onclick="guardarAsistenciaDocente()">💾 Guardar Asistencia</button>
                            </div>
                        </div>
                        ${renderTablaAsistenciaDocente(json.data.estudiantes)}
                    </div>

                    <div id="tabNotas" class="d-none">
                        <div class="alert alert-info small mb-2">
                            <i class="bi bi-info-circle"></i> <b>Nota:</b> Si un cuatrimestre no está aprobado (nota < 7 e intensificación < 4), habilita Diciembre automáticamente.
                        </div>
                        ${renderTablaNotasDocente(json.data.estudiantes)}
                    </div>

                    <div id="tabResumen" class="d-none">
                        ${renderTabResumen(json.data.estudiantes)}
                    </div>
                </div>
            </div>`;
        document.getElementById('contenido-dinamico').innerHTML = html;
        
        setTimeout(recalcularTodoAlInicio, 500);

    } catch (e) { 
        console.error(e);
        alert("Error cargando el curso."); 
        iniciarModuloDocente(); 
    }
}

function mostrarTabDocente(tab, btn) {
    document.getElementById('tabAsistencia').classList.add('d-none');
    document.getElementById('tabNotas').classList.add('d-none');
    document.getElementById('tabResumen').classList.add('d-none');
    document.querySelectorAll('#tabsDocente .nav-link').forEach(b => b.classList.remove('active'));
    
    const target = 'tab' + tab.charAt(0).toUpperCase() + tab.slice(1);
    document.getElementById(target).classList.remove('d-none');
    btn.classList.add('active');
}

// --- ASISTENCIA ---

function renderTablaAsistenciaDocente(est) {
    let html = `<div class="table-responsive"><table class="table table-hover table-striped align-middle border">
    <thead class="table-dark text-center">
        <tr>
            <th class="text-start ps-3">Estudiante</th>
            <th style="width: 80px;">% Asis</th>
            <th style="width: 80px;">Faltas</th>
            <th style="width: 80px;" class="bg-success">P</th>
            <th style="width: 80px;" class="bg-danger">A</th>
            <th style="width: 60px;">Edit</th> </tr>
    </thead>
    <tbody>`;
    
    est.forEach(e => {
        const porc = e.asistencia.porcentaje || 0;
        const faltas = e.asistencia.injustificadas || 0;
        let colorAsis = porc < 80 ? 'text-danger fw-bold' : 'text-success';

        html += `<tr>
        <td class="fw-bold ps-3 text-start">${e.nombre}</td>
        <td class="text-center ${colorAsis}">${porc}%</td>
        <td class="text-center fw-bold text-danger">${faltas}</td>
        <td class="text-center bg-success bg-opacity-10">
            <input type="radio" name="asis_${e.dni}" value="P" checked class="form-check-input" style="transform: scale(1.3); cursor:pointer;">
        </td>
        <td class="text-center bg-danger bg-opacity-10">
            <input type="radio" name="asis_${e.dni}" value="A" class="form-check-input" style="transform: scale(1.3); cursor:pointer;">
        </td>
        <td class="text-center">
             <button class="btn btn-sm btn-outline-secondary border-0" onclick="abrirModalJustificarDoc('${e.dni}', '${e.nombre}')">✏️</button>
        </td>
        </tr>`;
    });
    return html + `</tbody></table></div>`;
}

// --- TAB RESUMEN ---

function renderTabResumen(est) {
    let aprobados = 0, diciembre = 0, febrero = 0, ci = 0;
    let sumaAsis = 0;

    est.forEach(e => {
        sumaAsis += e.asistencia.porcentaje;
        const def = e.notas.nota_definitiva || "-";
        if(def === "C.I.") ci++;
        else if(def !== "-" && parseFloat(def) >= 4) aprobados++;
        // Lógica simplificada para conteo de instancias
        if(e.notas.diciembre !== "" && e.notas.nota_definitiva === "") diciembre++;
        if(e.notas.febrero !== "" && e.notas.nota_definitiva === "") febrero++;
    });

    const promedioAsis = est.length > 0 ? Math.round(sumaAsis / est.length) : 0;

    return `
    <div class="row g-3 mb-4">
        <div class="col-md-3">
            <div class="card bg-primary text-white text-center p-3 shadow-sm">
                <small>Asistencia Promedio</small>
                <h3 class="mb-0">${promedioAsis}%</h3>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card bg-success text-white text-center p-3 shadow-sm">
                <small>Aprobados</small>
                <h3 class="mb-0">${aprobados}</h3>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card bg-warning text-dark text-center p-3 shadow-sm">
                <small>En Instancias</small>
                <h3 class="mb-0">${diciembre + febrero}</h3>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card bg-danger text-white text-center p-3 shadow-sm">
                <small>Recursantes (C.I.)</small>
                <h3 class="mb-0">${ci}</h3>
            </div>
        </div>
    </div>
    <div class="table-responsive">
        <table class="table table-bordered table-sm text-center">
            <thead class="table-light">
                <tr><th>Estudiante</th><th>% Asist.</th><th>Faltas</th><th>Definitiva</th></tr>
            </thead>
            <tbody>
                ${est.map(e => `
                    <tr>
                        <td class="text-start">${e.nombre}</td>
                        <td>${e.asistencia.porcentaje}%</td>
                        <td class="text-danger">${e.asistencia.injustificadas}</td>
                        <td class="fw-bold">${e.notas.nota_definitiva || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>`;
}

// --- LÓGICA DE NOTAS (CON REGLA DE 10 Y 6) ---

function recalcularTodoAlInicio() {
    if(!window.cursoActualDocente) return;
    window.cursoActualDocente.estudiantes.forEach(e => calcularFila(e.dni));
}

function calcularFila(dni) {
    const row = document.querySelector(`tr[data-dni="${dni}"]`);
    if(!row) return;

    const inN1 = row.querySelector('.n1'), inI1 = row.querySelector('.i1');
    const inN2 = row.querySelector('.n2'), inI2 = row.querySelector('.i2');
    const inDic = row.querySelector('.dic'), inFeb = row.querySelector('.feb');
    const spanProm = row.querySelector('.promedio'), spanDef = row.querySelector('.definitiva');
    const tdDef = row.querySelector('.def-cell');

    let vN1 = parseFloat(inN1.value) || 0, vN2 = parseFloat(inN2.value) || 0;
    
    // Regla: Nota < 7 habilita intensificación
    if (inN1.value !== "" && vN1 < 7) inI1.disabled = false; else { inI1.disabled = true; inI1.value = ''; }
    if (inN2.value !== "" && vN2 < 7) inI2.disabled = false; else { inI2.disabled = true; inI2.value = ''; }

    let vI1 = parseFloat(inI1.value) || 0, vI2 = parseFloat(inI2.value) || 0;

    // ¿Aprobó el cuatrimestre?
    let aprobadoC1 = (vN1 >= 7) || (vI1 >= 4);
    let aprobadoC2 = (vN2 >= 7) || (vI2 >= 4);

    // Nota de cálculo para el promedio
    let notaEfec1 = (vN1 >= 7) ? vN1 : vI1;
    let notaEfec2 = (vN2 >= 7) ? vN2 : vI2;
    
    if (vN1 < 7 && inI1.value === "") notaEfec1 = vN1;
    if (vN2 < 7 && inI2.value === "") notaEfec2 = vN2;

    let promedio = 0, definitiva = "-";

    if (inN1.value !== "" && inN2.value !== "") {
        let calculo = (notaEfec1 + notaEfec2) / 2;
        promedio = parseFloat(calculo.toFixed(2));
        spanProm.innerText = promedio;

        // REGLA CLAVE: Promedio >= 7 Y AMBOS APROBADOS
        // Si tiene 10 y 6 (Prom 8), pero el 2do no está aprobado -> Va a Diciembre.
        if (promedio >= 7 && aprobadoC1 && aprobadoC2) {
            definitiva = Math.round(promedio);
            if(definitiva < 7) definitiva = 7;
            inDic.disabled = true; inDic.value = '';
            inFeb.disabled = true; inFeb.value = '';
        } else {
            // DEBE IR A DICIEMBRE
            inDic.disabled = false;
            let vDic = parseFloat(inDic.value) || 0;
            if (inDic.value !== "") {
                if (vDic >= 4) {
                    definitiva = vDic; inFeb.disabled = true; inFeb.value = '';
                } else {
                    inFeb.disabled = false;
                    let vFeb = parseFloat(inFeb.value) || 0;
                    if (inFeb.value !== "") definitiva = vFeb >= 4 ? vFeb : "C.I.";
                }
            } else { inFeb.disabled = true; }
        }
    } else {
        spanProm.innerText = "-"; inDic.disabled = true; inFeb.disabled = true;
    }

    spanDef.innerText = definitiva;
    tdDef.className = "text-center fw-bold text-white def-cell " + (definitiva === "C.I." ? "bg-danger" : (definitiva !== "-" ? "bg-success" : "bg-secondary"));
}

// (Mismas funciones auxiliares de guardarAsistenciaDocente, guardarNotasDocente, etc.)
