/* ============================================================
   validaciones.js — Validación de datos en el lado del cliente
   Alcaldía Municipal de Acoyapa — Constancia de Nacimiento
   ============================================================ */

const Validaciones = {

  /* Valida un campo individual según su tipo de regla.
     Devuelve true si es válido; en caso contrario muestra el error. */
  validarCampo(campo) {
    const regla = campo.dataset.validar || "";
    const valor = campo.value.trim();
    let mensaje = "";

    if (campo.required && valor === "") {
      mensaje = "Este campo es obligatorio.";
    } else if (valor !== "") {
      switch (regla) {
        case "nombre":
          if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñüÜ\s]{3,60}$/.test(valor))
            mensaje = "Ingrese solo letras (mínimo 3 caracteres).";
          break;
        case "cedula":
          // Formato de cédula nicaragüense: 001-280690-0001A
          if (!/^\d{3}-\d{6}-\d{4}[A-Za-z]$/.test(valor))
            mensaje = "Formato de cédula inválido. Ejemplo: 001-280690-0001A";
          break;
        case "telefono":
          if (!/^(\+?505\s?)?[2578]\d{3}-?\d{4}$/.test(valor.replace(/\s/g, "")))
            mensaje = "Ingrese un teléfono válido de Nicaragua (8 dígitos).";
          break;
        case "correo":
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor))
            mensaje = "Ingrese un correo electrónico válido.";
          break;
        case "fecha":
          if (!this.fechaValida(valor))
            mensaje = "Ingrese una fecha válida.";
          break;
        case "fecha-nacimiento": {
          if (!this.fechaValida(valor)) {
            mensaje = "Ingrese una fecha válida.";
          } else {
            const fecha = new Date(valor);
            const hoy = new Date();
            if (fecha > hoy) mensaje = "La fecha de nacimiento no puede ser futura.";
            else if (hoy.getFullYear() - fecha.getFullYear() > 120)
              mensaje = "Verifique el año de nacimiento.";
          }
          break;
        }
        case "numero-acta":
          if (!/^\d{1,6}$/.test(valor))
            mensaje = "Ingrese solo números (máximo 6 dígitos).";
          break;
        case "expediente":
          if (!/^ACO-\d{4}-\d{4}$/.test(valor.toUpperCase()))
            mensaje = "Formato de expediente inválido. Ejemplo: ACO-2026-0123";
          break;
        case "admin-usuario":
          if (valor.length < 3 || valor.length > 20)
            mensaje = "Ingrese un usuario válido.";
          break;
        case "admin-clave":
          if (valor.length < 4)
            mensaje = "La contraseña debe tener al menos 4 caracteres.";
          break;
      }
    }

    this.mostrarEstado(campo, mensaje);
    return mensaje === "";
  },

  /* Valida un grupo de botones de opción (radio) por nombre. */
  validarRadio(nombre, contenedor) {
    const seleccionado = document.querySelector(`input[name="${nombre}"]:checked`);
    const grupo = contenedor || document.querySelector(`input[name="${nombre}"]`)?.closest(".campo");
    if (!grupo) return !!seleccionado;
    if (!seleccionado) {
      grupo.classList.add("invalido");
      const err = grupo.querySelector(".mensaje-error");
      if (err) { err.textContent = "Seleccione una opción."; err.style.display = "block"; }
      return false;
    }
    grupo.classList.remove("invalido");
    const err = grupo.querySelector(".mensaje-error");
    if (err) err.style.display = "none";
    return true;
  },

  /* Comprueba que una cadena sea una fecha real. */
  fechaValida(valor) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
    const f = new Date(valor + "T00:00:00");
    return !isNaN(f.getTime());
  },

  /* Pinta el estado (válido / inválido) y el mensaje de error. */
  mostrarEstado(campo, mensaje) {
    const cont = campo.closest(".campo");
    if (!cont) return;
    const etiquetaError = cont.querySelector(".mensaje-error");
    if (mensaje) {
      cont.classList.add("invalido");
      cont.classList.remove("valido");
      if (etiquetaError) etiquetaError.textContent = mensaje;
    } else {
      cont.classList.remove("invalido");
      if (campo.value.trim() !== "") cont.classList.add("valido");
      else cont.classList.remove("valido");
    }
  },

  /* Valida todos los campos de un contenedor (un paso del formulario). */
  validarSeccion(seccion) {
    let correcto = true;
    const campos = seccion.querySelectorAll("input[data-validar], select[data-validar], textarea[data-validar], input[required], select[required]");
    campos.forEach((c) => {
      if (c.type === "radio" || c.type === "checkbox") return;
      if (!this.validarCampo(c)) correcto = false;
    });
    // Grupos de radio requeridos dentro de la sección
    const nombresRadio = new Set();
    seccion.querySelectorAll('input[type="radio"][required]').forEach((r) => nombresRadio.add(r.name));
    nombresRadio.forEach((n) => { if (!this.validarRadio(n)) correcto = false; });
    return correcto;
  },

  /* Activa la validación en vivo al salir de cada campo. */
  activarEnVivo(formulario) {
    formulario.querySelectorAll("input, select, textarea").forEach((c) => {
      if (c.type === "radio") {
        c.addEventListener("change", () => this.validarRadio(c.name));
      } else {
        c.addEventListener("blur", () => this.validarCampo(c));
        c.addEventListener("input", () => {
          if (c.closest(".campo")?.classList.contains("invalido")) this.validarCampo(c);
        });
      }
    });
  }
};

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
