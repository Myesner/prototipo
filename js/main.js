/* ============================================================
   main.js — Navegación móvil, asistente de solicitud, consulta
   y panel administrativo.
   Alcaldía Municipal de Acoyapa — Constancia de Nacimiento
   ============================================================ */

const STORAGE_KEY = "acoyapa_solicitudes";
const CONTADOR_KEY = "acoyapa_contador";
const ADMIN_SESSION = "acoyapa_admin_session";

const ESTADOS = ["Recibida", "En revisión", "Lista para entrega", "Entregada"];

function obtenerSolicitudes() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Error leyendo solicitudes", e);
    return [];
  }
}

function guardarSolicitudes(solicitudes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(solicitudes));
}

function generarExpediente() {
  const anio = new Date().getFullYear();
  let contador = parseInt(localStorage.getItem(CONTADOR_KEY) || "0", 10) + 1;
  localStorage.setItem(CONTADOR_KEY, String(contador));
  return `ACO-${anio}-${String(contador).padStart(4, "0")}`;
}

function normalizarTexto(texto) {
  return texto ? texto.trim() : "";
}

function textoSelect(id) {
  const s = document.getElementById(id);
  return s ? s.options[s.selectedIndex].text : "—";
}

function valorRadio(nombre) {
  return document.querySelector(`input[name="${nombre}"]:checked`)?.value || "—";
}

function formatearFecha(fechaIso) {
  if (!fechaIso) return "—";
  const f = new Date(fechaIso);
  if (isNaN(f.getTime())) return fechaIso;
  return f.toLocaleDateString("es-NI", { day: "2-digit", month: "2-digit", year: "numeric" });
}

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- Menú hamburguesa (móvil) ---------- */
  const botonMenu = document.getElementById("botonMenu");
  const navPrincipal = document.getElementById("navPrincipal");
  if (botonMenu && navPrincipal) {
    botonMenu.addEventListener("click", () => {
      const abierto = navPrincipal.classList.toggle("abierto");
      botonMenu.setAttribute("aria-expanded", abierto);
    });
  }

  /* ---------- Asistente de solicitud (3 pasos) ---------- */
  const asistente = document.getElementById("asistenteSolicitud");
  if (asistente) iniciarAsistente(asistente);

  /* ---------- Formulario de consulta de estado ---------- */
  const formConsulta = document.getElementById("formConsulta");
  if (formConsulta) iniciarConsulta(formConsulta);

  /* ---------- Panel administrativo ---------- */
  const formLogin = document.getElementById("formLogin");
  if (formLogin) iniciarAdmin();

  /* ---------- Máscaras de cédula ---------- */
  document.querySelectorAll("input[data-validar='cedula']").forEach(mascaraCedula);
});

/* ============================================================
   ASISTENTE DE SOLICITUD
   ============================================================ */
function iniciarAsistente(asistente) {
  const pasos = [...asistente.querySelectorAll(".paso-form")];
  const indicadores = [...document.querySelectorAll(".paso-ind")];
  let actual = 0;

  Validaciones.activarEnVivo(asistente);

  const mostrarPaso = (n) => {
    pasos.forEach((p, i) => p.classList.toggle("visible", i === n));
    indicadores.forEach((ind, i) => {
      ind.classList.toggle("activo", i === n);
      ind.classList.toggle("completo", i < n);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    actual = n;
  };

  /* Botones "Siguiente": validan el paso actual antes de avanzar */
  asistente.querySelectorAll("[data-accion='siguiente']").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!Validaciones.validarSeccion(pasos[actual])) {
        const primeroInvalido = pasos[actual].querySelector(".invalido input, .invalido select");
        primeroInvalido?.focus();
        return;
      }
      if (actual === 1) construirResumen();
      if (actual < pasos.length - 1) mostrarPaso(actual + 1);
    });
  });

  /* Botones "Anterior" */
  asistente.querySelectorAll("[data-accion='anterior']").forEach((btn) => {
    btn.addEventListener("click", () => mostrarPaso(Math.max(actual - 1, 0)));
  });

  /* Envío final: genera número de expediente y guarda en localStorage */
  asistente.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!Validaciones.validarSeccion(pasos[actual])) return;

    const expediente = generarExpediente();
    const solicitud = construirSolicitud(expediente);

    const solicitudes = obtenerSolicitudes();
    solicitudes.push(solicitud);
    guardarSolicitudes(solicitudes);

    document.getElementById("numeroExpediente").textContent = expediente;
    document.getElementById("asistenteSolicitud").style.display = "none";
    document.getElementById("indicadorPasos").style.display = "none";
    const exito = document.getElementById("avisoExito");
    exito.style.display = "block";
    exito.scrollIntoView({ behavior: "smooth" });
  });

  mostrarPaso(0);

  /* Construye el resumen del paso 3 con los datos capturados */
  function construirResumen() {
    const v = (id) => normalizarTexto(document.getElementById(id)?.value) || "—";
    const pares = {
      "resNombre": `${v("nombreTitular")} ${v("apellidosTitular")}`,
      "resFechaNac": formatearFecha(v("fechaNacimiento")),
      "resMunicipio": textoSelect("municipioRegistro"),
      "resActa": v("numeroActa") || "No indicado",
      "resSolicitante": `${v("nombreSolicitante")} ${v("apellidosSolicitante")}`,
      "resCedula": v("cedulaSolicitante"),
      "resParentesco": textoSelect("parentesco"),
      "resEntrega": valorRadio("modalidadEntrega"),
      "resCopias": textoSelect("numeroCopias"),
    };
    Object.entries(pares).forEach(([id, valor]) => {
      const nodo = document.getElementById(id);
      if (nodo) nodo.textContent = valor;
    });
  }

  /* Serializa todos los datos del formulario en un objeto */
  function construirSolicitud(expediente) {
    const v = (id) => normalizarTexto(document.getElementById(id)?.value);
    const selText = (id) => textoSelect(id);
    return {
      expediente,
      fechaSolicitud: new Date().toISOString(),
      estado: "Recibida",
      registrado: {
        nombres: v("nombreTitular"),
        apellidos: v("apellidosTitular"),
        fechaNacimiento: v("fechaNacimiento"),
        municipio: selText("municipioRegistro"),
        numeroActa: v("numeroActa") || null,
        tomoLibro: v("tomoActa") || null,
        madre: v("nombreMadre"),
        padre: v("nombrePadre") || null,
      },
      solicitante: {
        nombres: v("nombreSolicitante"),
        apellidos: v("apellidosSolicitante"),
        cedula: v("cedulaSolicitante"),
        parentesco: selText("parentesco"),
        telefono: v("telefonoSolicitante"),
        correo: v("correoSolicitante"),
      },
      entrega: {
        modalidad: valorRadio("modalidadEntrega"),
        copias: parseInt(v("numeroCopias") || "1", 10),
        motivo: selText("motivo"),
      }
    };
  }
}

/* ============================================================
   CONSULTA DE ESTADO DEL TRÁMITE
   ============================================================ */
function iniciarConsulta(form) {
  Validaciones.activarEnVivo(form);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const campoExpediente = document.getElementById("consultaExpediente");
    if (!Validaciones.validarCampo(campoExpediente)) return;

    const expediente = normalizarTexto(campoExpediente.value).toUpperCase();
    const solicitudes = obtenerSolicitudes();
    const solicitud = solicitudes.find((s) => s.expediente === expediente);

    const resultado = document.getElementById("resultadoConsulta");
    const encontrado = document.getElementById("resultadoEncontrado");
    const noEncontrado = document.getElementById("resultadoNoEncontrado");

    if (!solicitud) {
      document.getElementById("expedienteNoEncontrado").textContent = expediente;
      encontrado.style.display = "none";
      noEncontrado.style.display = "block";
      resultado.style.display = "block";
      resultado.scrollIntoView({ behavior: "smooth" });
      return;
    }

    document.getElementById("expedienteMostrado").textContent = expediente;
    document.getElementById("infoSolicitante").textContent =
      `${solicitud.solicitante.nombres} ${solicitud.solicitante.apellidos}`;
    document.getElementById("infoCedula").textContent = solicitud.solicitante.cedula;
    document.getElementById("infoRegistrado").textContent =
      `${solicitud.registrado.nombres} ${solicitud.registrado.apellidos}`;
    document.getElementById("infoEntrega").textContent = solicitud.entrega.modalidad;
    document.getElementById("infoCopias").textContent = `${solicitud.entrega.copias} ${solicitud.entrega.copias === 1 ? "copia" : "copias"}`;
    document.getElementById("infoFecha").textContent = formatearFecha(solicitud.fechaSolicitud);

    const idxEstado = ESTADOS.indexOf(solicitud.estado);
    const hitos = document.querySelectorAll("#lineaTiempo li");
    hitos.forEach((li) => {
      li.classList.remove("hecho", "actual");
      const estadoLi = li.dataset.estado;
      const idxLi = ESTADOS.indexOf(estadoLi);
      if (idxEstado >= 0) {
        if (idxLi < idxEstado) li.classList.add("hecho");
        else if (idxLi === idxEstado) li.classList.add("actual");
      }
    });

    const mensajes = {
      "Recibida": "Su solicitud fue recibida y está pendiente de verificación documental.",
      "En revisión": "Los datos del registro están siendo verificados por la Oficina del Registro Civil.",
      "Lista para entrega": "Su constancia está lista. Puede recogerla en la ventanilla del Registro Civil o recibirla según la modalidad elegida.",
      "Entregada": "Su constancia fue entregada según la modalidad de entrega elegida."
    };
    document.getElementById("mensajeEstado").textContent = mensajes[solicitud.estado] || solicitud.estado;

    noEncontrado.style.display = "none";
    encontrado.style.display = "block";
    resultado.style.display = "block";
    resultado.scrollIntoView({ behavior: "smooth" });
  });
}

/* ============================================================
   PANEL ADMINISTRATIVO
   ============================================================ */
function iniciarAdmin() {
  const formLogin = document.getElementById("formLogin");
  const seccionLogin = document.getElementById("seccionLogin");
  const seccionDashboard = document.getElementById("seccionDashboard");

  Validaciones.activarEnVivo(formLogin);

  formLogin.addEventListener("submit", (e) => {
    e.preventDefault();
    const usuario = document.getElementById("usuarioAdmin");
    const clave = document.getElementById("claveAdmin");
    if (!Validaciones.validarCampo(usuario) || !Validaciones.validarCampo(clave)) return;

    if (usuario.value.trim() === "admin" && clave.value === "admin123") {
      localStorage.setItem(ADMIN_SESSION, "true");
      mostrarDashboard();
    } else {
      const campoClave = clave.closest(".campo");
      campoClave.classList.add("invalido");
      const err = campoClave.querySelector(".mensaje-error");
      if (err) {
        err.textContent = "Usuario o contraseña incorrectos.";
        err.style.display = "block";
      }
    }
  });

  document.getElementById("btnLogout").addEventListener("click", () => {
    localStorage.removeItem(ADMIN_SESSION);
    seccionDashboard.style.display = "none";
    seccionLogin.style.display = "block";
    formLogin.reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  if (localStorage.getItem(ADMIN_SESSION) === "true") {
    mostrarDashboard();
  }

  function mostrarDashboard() {
    seccionLogin.style.display = "none";
    seccionDashboard.style.display = "block";
    renderizarDashboard();
  }
}

function renderizarDashboard() {
  const solicitudes = obtenerSolicitudes();
  const tbody = document.getElementById("cuerpoTablaSolicitudes");
  const vacio = document.getElementById("mensajeVacio");
  const stats = document.getElementById("resumenStats");

  /* Estadísticas por estado */
  const conteos = {};
  ESTADOS.forEach((e) => conteos[e] = 0);
  solicitudes.forEach((s) => { if (conteos[s.estado] !== undefined) conteos[s.estado]++; });
  const total = solicitudes.length;

  stats.innerHTML = `
    <div class="stat"><span class="valor">${total}</span><span class="etiqueta">Total solicitudes</span></div>
    ${ESTADOS.map((e) => `<div class="stat"><span class="valor">${conteos[e]}</span><span class="etiqueta">${e}</span></div>`).join("")}
  `;

  if (solicitudes.length === 0) {
    tbody.innerHTML = "";
    vacio.style.display = "block";
    return;
  }
  vacio.style.display = "none";

  tbody.innerHTML = solicitudes.map((s, index) => {
    const registrado = `${s.registrado.nombres} ${s.registrado.apellidos}`;
    const solicitante = `${s.solicitante.nombres} ${s.solicitante.apellidos}`;
    const claseEstado = `estado-${s.estado.replace(/\s+/g, "-")}`;
    const opciones = ESTADOS.map((e) =>
      `<option value="${e}"${e === s.estado ? " selected" : ""}>${e}</option>`
    ).join("");

    return `
      <tr>
        <td><strong>${s.expediente}</strong></td>
        <td>${registrado}</td>
        <td>${solicitante}</td>
        <td>${s.solicitante.cedula}</td>
        <td>${formatearFecha(s.fechaSolicitud)}</td>
        <td><span class="estado-badge ${claseEstado}">${s.estado}</span></td>
        <td>${s.entrega.modalidad}</td>
        <td class="acciones">
          <select class="select-estado" data-index="${index}" aria-label="Cambiar estado de ${s.expediente}">
            ${opciones}
          </select>
        </td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll(".select-estado").forEach((select) => {
    select.addEventListener("change", () => {
      const idx = parseInt(select.dataset.index, 10);
      const nuevoEstado = select.value;
      const solicitudes = obtenerSolicitudes();
      if (solicitudes[idx]) {
        solicitudes[idx].estado = nuevoEstado;
        guardarSolicitudes(solicitudes);
        renderizarDashboard();
      }
    });
  });
}

/* Máscara sencilla para la cédula nicaragüense mientras se escribe */
function mascaraCedula(input) {
  input.addEventListener("input", () => {
    let v = input.value.toUpperCase().replace(/[^0-9A-Z]/g, "");
    let salida = "";
    if (v.length > 0) salida = v.substring(0, 3);
    if (v.length > 3) salida += "-" + v.substring(3, 9);
    if (v.length > 9) salida += "-" + v.substring(9, 14);
    input.value = salida;
  });
}
