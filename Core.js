// ============================================================================
// ARCHIVO: Core.js (VERSIÓN MEJORADA CON GESTIÓN DE DATOS)
// ============================================================================

// --- URL DE GOOGLE APPS SCRIPT ---
const URL_API = "https://script.google.com/macros/s/AKfycbyTGnoS8hevr6k7pXE16p7KtcQxYrYP0yc11yJoJyvfX8Z7pEKJ5ZYymJ--IBcoVqUB/exec"; 

// --- SISTEMA CENTRALIZADO DE DATOS ---
const SistemaDatos = {
  // Datos en memoria
  cache: {
    estudiantes: { datos: [], timestamp: 0 },
    docentes: { datos: [], timestamp: 0 },
    preceptores: { datos: [], timestamp: 0 },
    materias: { datos: [], timestamp: 0 }
  },
  
  // Usuario actual
  usuario: null,
  
  // Configuración
  config: {
    tiempoCache: 5 * 60 * 1000, // 5 minutos en milisegundos
    debug: false
  },
  
  // --- MÉTODOS ---
  
  // Guardar datos en cache
  guardarEnCache: function(tipo, datos) {
    if (this.cache[tipo]) {
      this.cache[tipo].datos = datos;
      this.cache[tipo].timestamp = Date.now();
      
      if (this.config.debug) {
        console.log(`✅ Datos de ${tipo} guardados en cache:`, datos.length, 'registros');
      }
    }
  },
  
  // Obtener datos del cache (si están frescos)
  obtenerDelCache: function(tipo) {
    if (this.cache[tipo] && this.cache[tipo].datos.length > 0) {
      const tiempoTranscurrido = Date.now() - this.cache[tipo].timestamp;
      
      if (tiempoTranscurrido < this.config.tiempoCache) {
        if (this.config.debug) {
          console.log(`📦 Datos de ${tipo} obtenidos del cache (${Math.round(tiempoTranscurrido/1000)}s)`);
        }
        return this.cache[tipo].datos;
      } else {
        if (this.config.debug) {
          console.log(`⏰ Cache de ${tipo} expirado (${Math.round(tiempoTranscurrido/1000)}s)`);
        }
      }
    }
    return null; // Cache vacío o expirado
  },
  
  // Limpiar cache específico o todo
  limpiarCache: function(tipo = null) {
    if (tipo) {
      if (this.cache[tipo]) {
        this.cache[tipo].datos = [];
        this.cache[tipo].timestamp = 0;
        console.log(`🗑️ Cache de ${tipo} limpiado`);
      }
    } else {
      // Limpiar todo
      Object.keys(this.cache).forEach(key => {
        this.cache[key].datos = [];
        this.cache[key].timestamp = 0;
      });
      console.log('🗑️ Todo el cache limpiado');
    }
  },
  
  // Establecer usuario
  setUsuario: function(datosUsuario) {
    this.usuario = datosUsuario;
    
    // Guardar en localStorage para persistencia
    try {
      localStorage.setItem('usuarioEscolar', JSON.stringify(datosUsuario));
    } catch (e) {
      console.warn('No se pudo guardar usuario en localStorage:', e);
    }
  },
  
  // Obtener usuario
  getUsuario: function() {
    if (!this.usuario) {
      // Intentar recuperar de localStorage
      try {
        const guardado = localStorage.getItem('usuarioEscolar');
        if (guardado) {
          this.usuario = JSON.parse(guardado);
        }
      } catch (e) {
        console.warn('No se pudo recuperar usuario de localStorage:', e);
      }
    }
    return this.usuario;
  },
  
  // Cerrar sesión
  cerrarSesion: function() {
    this.usuario = null;
    this.limpiarCache();
    
    // Limpiar localStorage
    try {
      localStorage.removeItem('usuarioEscolar');
    } catch (e) {
      console.warn('Error al limpiar localStorage:', e);
    }
  }
};

// --- ALIAS PARA FACIL USO ---
const obtenerDatos = (tipo) => SistemaDatos.obtenerDelCache(tipo) || [];
const guardarDatos = (tipo, datos) => SistemaDatos.guardarEnCache(tipo, datos);
const limpiarDatos = (tipo) => SistemaDatos.limpiarCache(tipo);

// --- VARIABLES GLOBALES (para compatibilidad con código existente) ---
let usuarioActual = null; // Se sincronizará con SistemaDatos
let baseDatosAlumnos = [];
let baseDatosDocentes = [];
let baseDatosPreceptores = [];

// --- SINCRONIZAR VARIABLES GLOBALES CON SISTEMA ---
function sincronizarVariablesGlobales() {
  usuarioActual = SistemaDatos.getUsuario();
  baseDatosAlumnos = obtenerDatos('estudiantes');
  baseDatosDocentes = obtenerDatos('docentes');
  baseDatosPreceptores = obtenerDatos('preceptores');
}

// ==========================================
// LOGIN Y DASHBOARD (VERSIÓN MEJORADA)
// ==========================================

async function iniciarSesion() {
  const email = document.getElementById('email').value.trim();
  const clave = document.getElementById('clave').value.trim();
  const btn = document.getElementById('btn-login');
  const errorMsg = document.getElementById('error-msg');
  
  // Validación básica
  if (!email || !clave) {
    errorMsg.innerText = "Por favor completa todos los campos";
    errorMsg.classList.remove('d-none');
    return;
  }
  
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Verificando...';
  btn.disabled = true;
  errorMsg.classList.add('d-none');

  try {
    const resp = await fetch(`${URL_API}?op=login&email=${encodeURIComponent(email)}&pass=${encodeURIComponent(clave)}`);
    
    if (!resp.ok) {
      throw new Error(`Error de red: ${resp.status}`);
    }
    
    const data = await resp.json();

    if (data.status === 'success') {
      // Guardar en sistema centralizado
      SistemaDatos.setUsuario(data);
      sincronizarVariablesGlobales();
      
      // Cargar dashboard
      cargarDashboard(data);
      
      // Cargar datos iniciales en segundo plano
      cargarDatosInicialesEnSegundoPlano();
      
    } else {
      errorMsg.innerText = data.message || "Credenciales incorrectas";
      errorMsg.classList.remove('d-none');
    }
  } catch (e) {
    console.error('Error en login:', e);
    errorMsg.innerText = "Error de conexión. Verifica tu internet.";
    errorMsg.classList.remove('d-none');
  } finally {
    btn.innerHTML = "Ingresar";
    btn.disabled = false;
  }
}

// Cargar datos en segundo plano para mejor experiencia
async function cargarDatosInicialesEnSegundoPlano() {
  const usuario = SistemaDatos.getUsuario();
  
  if (usuario.rol === 'Directivo') {
    try {
      // Cargar estudiantes
      const respEst = await fetch(`${URL_API}?op=getEstudiantes&rol=Directivo`);
      const jsonEst = await respEst.json();
      if (jsonEst.status === 'success') {
        guardarDatos('estudiantes', jsonEst.data);
      }
      
      // Cargar docentes
      const respDoc = await fetch(`${URL_API}?op=getDocentes&rol=Directivo`);
      const jsonDoc = await respDoc.json();
      if (jsonDoc.status === 'success') {
        guardarDatos('docentes', jsonDoc.data);
      }
      
    } catch (e) {
      console.warn('Error cargando datos en segundo plano:', e);
    }
  }
}

// Resto del código de cargarDashboard permanece igual...
// [Mantén tu función cargarDashboard existente aquí]

function calcularEdad(fechaString) {
  if (!fechaString) return "-";
  try {
    const hoy = new Date();
    const nacimiento = new Date(fechaString);
    
    // Validar que la fecha sea válida
    if (isNaN(nacimiento.getTime())) return "-";
    
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) { 
      edad--; 
    }
    
    return edad + " años";
  } catch (e) {
    console.error('Error calculando edad:', e);
    return "-";
  }
}
