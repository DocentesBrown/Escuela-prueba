// ============================================================================
// ARCHIVO: Admin_Estudiantes.js
// ============================================================================

let cacheMateriasGlobal = []; 

async function verEstudiantes() {
    document.getElementById('contenido-dinamico').innerHTML = '<div class="spinner-border text-primary"></div> Cargando Estudiantes...';
    try {
        const resp = await fetch(`${URL_API}?op=getEstudiantes&rol=Directivo`);
        const json = await resp.json();
        baseDatosAlumnos = json.data;

        let html = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5>Gestión de Estudiantes</h5>
                <button onclick="abrirModalEstudiante()" class="btn btn-success">+ Nuevo Estudiante</button>
            </div>
            <div class="card mb-3 shadow-sm">
                <div class="card-body">
                    <div class="row g-2">
                        <div class="col-md-8">
                            <input type="text" class="form-control" id="buscadorEstudiantes" placeholder="Buscar..." onkeyup="filtrarEstudiantes()">
                        </div>
                        <div class="col-md-4">
                            <select class="form-select" id="filtroEstudiantes" onchange="filtrarEstudiantes()">
                                <option value="todos">Todos los campos</option>
                                <option value="nombre">Nombre</option>
                                <option value="dni">DNI</option>
                                <option value="curso">Curso</option>
                            </select>
                        </div>
                    </div>
                    <div class="mt-2 text-muted small"><span id="contadorEstudiantes">${json.data.length} estudiantes</span></div>
                </div>
            </div>
            
            <div class="table-responsive bg-white rounded shadow-sm" style="max-height: 600px; overflow-y: auto;">
                <table class="table table-hover table-bordered mb-0 align-middle">
                    <thead class="table-dark text-center" style="position: sticky; top: 0;">
                        <tr><th>DNI</th><th>Nombre</th><th>Edad</th><th>Curso</th><th>Acciones</th></tr>
                    </thead>
                    <tbody id="tbodyEstudiantes">`;
        
        json.data.forEach((fila, index) => {
            const edad = calcularEdad(fila[6]);
            // fila[2] es el Curso. Ahora se verá actualizado tras la inscripción.
            html += `
                <tr class="fila-estudiante" data-dni="${fila[0]}" data-nombre="${String(fila[1]).toLowerCase()}" data-curso="${String(fila[2]).toLowerCase()}" data-email="${fila[3]}">
                    <td>${fila[0]}</td>
                    <td>${fila[1]}</td>
                    <td class="text-center fw-bold text-primary">${edad}</td>
                    <td class="text-center"><span class="badge bg-secondary">${fila[2]}</span></td>
                    <td class="text-center" style="width: 180px;">
                        <button class="btn btn-sm btn-outline-success me-1" onclick="abrirModalInscripcion(${index})" title="Inscribir Materias">📋</button>
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="editarEstudiante(${index})" title="Editar Datos">✏️</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="borrarEstudiante('${fila[0]}', '${fila[3]}')" title="Borrar">🗑️</button>
                    </td>
                </tr>`;
        });
        html += `</tbody></table></div>`;
        html += renderModalHTML() + renderModalInscripcionHTML();
        
        document.getElementById('contenido-dinamico').innerHTML = html;
        
    } catch (e) {
        console.error(e);
        alert("Error al cargar estudiantes.");
    }
}

function filtrarEstudiantes() {
    const busqueda = document.getElementById('buscadorEstudiantes').value.toLowerCase();
    const filtro = document.getElementById('filtroEstudiantes').value;
    const filas = document.querySelectorAll('#tbodyEstudiantes tr.fila-estudiante');
    let contador = 0;
    
    filas.forEach(fila => {
        let mostrar = false;
        if (!busqueda) mostrar = true;
        else {
            if(filtro === 'nombre') mostrar = fila.dataset.nombre.includes(busqueda);
            else if(filtro === 'dni') mostrar = fila.dataset.dni.includes(busqueda);
            else if(filtro === 'curso') mostrar = fila.dataset.curso.includes(busqueda);
            else mostrar = (fila.dataset.nombre.includes(busqueda) || fila.dataset.dni.includes(busqueda) || fila.dataset.curso.includes(busqueda));
        }
        fila.style.display = mostrar ? '' : 'none';
        if(mostrar) contador++;
    });
    document.getElementById('contadorEstudiantes').innerText = `${contador} estudiantes`;
}

// --- INSCRIPCIÓN ---

async function abrirModalInscripcion(index) {
    const est = baseDatosAlumnos[index]; 
    const dni = est[0];
    const cursoActualEstudiante = String(est[2]).trim(); 

    document.getElementById('ins_dni_est').value = dni;
    document.getElementById('ins_nombre_est').value = est[1];
    document.getElementById('tituloInscripcion').innerText = `Inscripción: ${est[1]}`;

    const modal = new bootstrap.Modal(document.getElementById('modalInscripcion'));
    modal.show();
    
    const container = document.getElementById('gridMaterias');
    const selectorCurso = document.getElementById('ins_curso_selector');
    
    container.innerHTML = '<div class="text-center p-4"><div class="spinner-border text-success"></div><br>Cargando materias...</div>';
    selectorCurso.innerHTML = '<option>Cargando cursos...</option>';

    try {
        const respMat = await fetch(`${URL_API}?op=getMaterias&rol=Directivo`);
        const jsonMat = await respMat.json();
        cacheMateriasGlobal = jsonMat.data; 

        const respCursos = await fetch(`${URL_API}?op=getCursosDisponibles&rol=Directivo`);
        const jsonCursos = await respCursos.json();
        
        let optsCursos = `<option value="">-- Seleccionar Curso --</option>`;
        jsonCursos.data.forEach(c => {
            const selected = (String(c).trim() === cursoActualEstudiante) ? 'selected' : '';
            optsCursos += `<option value="${c}" ${selected}>${c}</option>`;
        });
        selectorCurso.innerHTML = optsCursos;

        let opcionesMaterias = `<option value="">-- Seleccionar --</option>`;
        cacheMateriasGlobal.forEach(m => { 
            opcionesMaterias += `<option value="${m[1]} (${m[3]})">${m[1]} (${m[3]})</option>`; 
        });

        let htmlForm = `<h6 class="bg-light p-2 border-top border-bottom mt-3">Materias Regulares</h6><div class="row g-2 mb-3">`;
        for(let i=1; i<=12; i++) {
            htmlForm += `
            <div class="col-md-6 d-flex align-items-center mb-1">
                <span class="me-2 fw-bold text-muted small" style="width:20px">${i}.</span>
                <select id="materia_${i}" class="form-select form-select-sm me-1">${opcionesMaterias}</select>
                <select id="estado_${i}" class="form-select form-select-sm" style="width:100px">
                    <option value="Cursa">Cursa</option>
                    <option value="Recursa">Recursa</option>
                </select>
            </div>`;
        }
        
        htmlForm += `</div><h6 class="bg-warning bg-opacity-25 p-2 border-top border-bottom">Intensificaciones</h6><div class="row g-2">`;
        for(let j=1; j<=4; j++) {
            htmlForm += `<div class="col-12 d-flex align-items-center mb-1"><span class="me-2 fw-bold text-muted small" style="width:20px">${j}.</span><select id="int_adeuda_${j}" class="form-select form-select-sm me-1">${opcionesMaterias}</select> en <select id="int_en_${j}" class="form-select form-select-sm ms-1">${opcionesMaterias}</select></div>`;
        }
        htmlForm += `</div>`;
        container.innerHTML = htmlForm;

        const respIns = await fetch(`${URL_API}?op=getInscripcion&rol=Directivo&dni=${dni}`);
        const jsonIns = await respIns.json();
        
        if(jsonIns.status === 'success') {
            const data = jsonIns.data; 
            for(let i=1; i<=12; i++) {
                if(data[i+1] && data[i+1].includes(' - ')) {
                    const partes = data[i+1].split(' - ');
                    if(partes[0]) {
                         document.getElementById(`materia_${i}`).value = partes[0];
                         document.getElementById(`estado_${i}`).value = partes[1];
                    }
                }
            }
            for(let j=1; j<=4; j++) {
                if(data[13+j] && data[13+j].includes(' -> ')) {
                    const partes = data[13+j].split(' -> ');
                    document.getElementById(`int_adeuda_${j}`).value = partes[0];
                    document.getElementById(`int_en_${j}`).value = partes[1];
                }
            }
        } else {
             if(cursoActualEstudiante) { cargarMateriasPorCurso(); }
        }

    } catch (e) { 
        console.error(e);
        container.innerHTML = '<div class="alert alert-danger">Error cargando formulario.</div>'; 
    }
}

function cargarMateriasPorCurso() {
    const cursoSeleccionado = document.getElementById('ins_curso_selector').value;
    if(!cursoSeleccionado) return;

    const materiasDelCurso = cacheMateriasGlobal.filter(m => String(m[3]).trim() === String(cursoSeleccionado).trim());

    for(let i=1; i<=12; i++) {
         document.getElementById(`materia_${i}`).value = "";
         document.getElementById(`estado_${i}`).value = "Cursa";
    }

    materiasDelCurso.forEach((mat, index) => {
        if(index < 12) {
            const i = index + 1;
            const valorSelect = `${mat[1]} (${mat[3]})`; 
            const selectElement = document.getElementById(`materia_${i}`);
            let existe = Array.from(selectElement.options).some(option => option.value === valorSelect);
            
            if(existe) {
                selectElement.value = valorSelect;
                document.getElementById(`estado_${i}`).value = "Cursa";
            }
        }
    });
}

// --- GUARDA INSCRIPCIÓN Y ACTUALIZA CURSO ---
async function guardarInscripcion() {
  const btn = document.getElementById('btnGuardarIns');
  const dni = document.getElementById('ins_dni_est').value;
  const nombre = document.getElementById('ins_nombre_est').value;
  const cursoSeleccionado = document.getElementById('ins_curso_selector').value;
  
  // --- VALIDACIONES PREVIAS ---
  if (!dni || !nombre) {
    alert("❌ Error: Faltan datos básicos del estudiante");
    return;
  }
  
  if (!cursoSeleccionado) {
    alert("❌ Por favor selecciona un curso en 'Paso 1: Definir Curso'");
    document.getElementById('ins_curso_selector').focus();
    return;
  }
  
  // Verificar que haya al menos una materia seleccionada
  let tieneMaterias = false;
  for (let i = 1; i <= 12; i++) {
    if (document.getElementById(`materia_${i}`).value) {
      tieneMaterias = true;
      break;
    }
  }
  
  if (!tieneMaterias) {
    const confirmar = confirm("⚠️ No has seleccionado ninguna materia regular. ¿Deseas continuar solo con el curso?");
    if (!confirmar) return;
  }
  
  // --- PREPARAR DATOS ---
  btn.disabled = true; 
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';
  
  const datos = { 
    op: 'guardarInscripcion', 
    dni: dni,
    nombre: nombre,
    curso: cursoSeleccionado // ENVIAMOS EL CURSO NUEVO
  };
  
  // Materias regulares (1-12)
  for (let i = 1; i <= 12; i++) {
    const selectMateria = document.getElementById(`materia_${i}`);
    const selectEstado = document.getElementById(`estado_${i}`);
    
    const materia = selectMateria ? selectMateria.value : '';
    const estado = selectEstado ? selectEstado.value : 'Cursa';
    
    if (materia) {
      datos[`m${i}`] = `${materia} - ${estado}`;
    } else {
      datos[`m${i}`] = "";
    }
  }
  
  // Intensificaciones (1-4)
  for (let j = 1; j <= 4; j++) {
    const selectAdeuda = document.getElementById(`int_adeuda_${j}`);
    const selectEn = document.getElementById(`int_en_${j}`);
    
    const adeuda = selectAdeuda ? selectAdeuda.value : '';
    const en = selectEn ? selectEn.value : '';
    
    if (adeuda && en) {
      // Validar que no sea la misma materia
      if (adeuda === en) {
        alert(`⚠️ Advertencia: La intensificación ${j} tiene la misma materia en ambos campos. Se omitirá.`);
        datos[`i${j}`] = "";
      } else {
        datos[`i${j}`] = `${adeuda} -> ${en}`;
      }
    } else {
      datos[`i${j}`] = "";
    }
  }
  
  // --- ENVIAR AL SERVIDOR ---
  try {
    const respuesta = await fetch(URL_API, { 
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datos) 
    });
    
    const resultado = await respuesta.json();
    
    if (resultado.status === 'success') {
      // Cerrar modal
      const modalEl = document.getElementById('modalInscripcion');
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
      
      // Mostrar mensaje de éxito
      alert(`✅ Inscripción guardada correctamente\nCurso: ${cursoSeleccionado}`);
      
      // Recargar la tabla para ver cambios
      setTimeout(() => {
        verEstudiantes();
      }, 500);
      
    } else {
      throw new Error(resultado.message || 'Error desconocido');
    }
    
  } catch (error) {
    console.error('Error al guardar inscripción:', error);
    alert(`❌ Error al guardar: ${error.message}\n\nVerifica tu conexión e intenta nuevamente.`);
    
  } finally { 
    // Restaurar botón
    btn.disabled = false; 
    btn.innerHTML = '💾 Guardar Inscripción';
  }
}

// --- CRUD ---
function abrirModalEstudiante() {
    document.getElementById('modalTitle').innerText = "Nuevo Estudiante";
    document.getElementById('formEstudiante').reset();
    document.getElementById('accion_form').value = "crear";
    new bootstrap.Modal(document.getElementById('modalEstudiante')).show();
}
function editarEstudiante(index) {
    const est = baseDatosAlumnos[index];
    document.getElementById('modalTitle').innerText = "Editar Estudiante";
    document.getElementById('accion_form').value = "editar";
    document.getElementById('dni_original').value = est[0];
    document.getElementById('inp_dni').value = est[0];
    document.getElementById('inp_nombre').value = est[1];
    document.getElementById('inp_curso').value = est[2];
    document.getElementById('inp_email').value = est[3];
    document.getElementById('inp_adulto').value = est[4];
    document.getElementById('inp_tel').value = est[5];
    if(est[6]) document.getElementById('inp_nacimiento').value = new Date(est[6]).toISOString().split('T')[0];
    new bootstrap.Modal(document.getElementById('modalEstudiante')).show();
}
async function guardarEstudiante() {
    const btn = document.getElementById('btnGuardarModal');
    btn.disabled = true; btn.innerText = "Guardando...";
    const datos = {
        op: 'administrarEstudiante',
        accion: document.getElementById('accion_form').value,
        dni: document.getElementById('inp_dni').value,
        nombre: document.getElementById('inp_nombre').value,
        curso: document.getElementById('inp_curso').value,
        email: document.getElementById('inp_email').value,
        adulto: document.getElementById('inp_adulto').value,
        telefono: document.getElementById('inp_tel').value,
        nacimiento: document.getElementById('inp_nacimiento').value,
        dniOriginal: document.getElementById('dni_original').value
    };
    try {
        await fetch(URL_API, { method: 'POST', body: JSON.stringify(datos) });
        bootstrap.Modal.getInstance(document.getElementById('modalEstudiante')).hide();
        verEstudiantes(); 
    } catch (e) { alert("Error al guardar."); } finally { btn.disabled = false; btn.innerText = "Guardar"; }
}
async function borrarEstudiante(dni, email) {
    if(!confirm(`¿Eliminar alumno DNI ${dni}?`)) return;
    try { 
        await fetch(URL_API, { method: 'POST', body: JSON.stringify({ op: 'administrarEstudiante', accion: 'borrar', dni: dni, email: email }) });
        verEstudiantes(); 
    } catch (e) { alert("Error al eliminar."); }
}
