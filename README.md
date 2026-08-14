# Solicitud en línea de constancia de nacimiento — Alcaldía Municipal de Acoyapa

Prototipo funcional de una aplicación web que permite a los ciudadanos del municipio de
Acoyapa (Chontales, Nicaragua) solicitar la constancia de nacimiento de forma completamente
digital, sin necesidad de trasladarse a las oficinas del Registro Civil.

> **Nota:** proyecto académico de la asignatura de Arquitectura de Información.
> No constituye un sitio oficial del Gobierno de Nicaragua.

## Integrantes

- Br. Jeffry Enoc Sevilla Aguilar
- Br. Yesner Steven Mejia Jaime
- Br. Enoc Nehemias Garcia Alcantara

## Perfiles de usuario

El prototipo contempla tres perfiles de usuario:

1. **Ciudadano solicitante:** persona que inicia el trámite, guarda su número de expediente y consulta el estado.
2. **Funcionario del Registro Civil (admin):** accede al panel administrativo para visualizar, gestionar y cambiar el estado de las solicitudes.
3. **Visitante / invitado:** navega por el inicio, requisitos y puede consultar el estado si conoce un número de expediente válido.

## Características

- **Página de inicio** con presentación del servicio, pasos del trámite, servicios disponibles y requisitos.
- **Formulario-asistente en tres pasos** (tres formularios interactivos encadenados):
  1. Datos de la persona registrada.
  2. Datos del solicitante.
  3. Modalidad de entrega, número de copias y resumen de confirmación.
- **Persistencia en `localStorage`:** cada solicitud genera un número de expediente único `ACO-AAAA-XXXX` y queda almacenada localmente.
- **Panel administrativo** con inicio de sesión, tabla de solicitudes, resumen estadístico y cambio de estados.
- **Tres formularios interactivos:** asistente de solicitud, consulta de estado y login de administración.
- **Validación de datos en el lado del cliente (JavaScript):**
  - Cédula nicaragüense con formato `000-000000-0000A` (máscara automática).
  - Teléfonos de Nicaragua de 8 dígitos (con o sin prefijo +505).
  - Correo electrónico, fechas de nacimiento reales y no futuras.
  - Campos obligatorios, selecciones, botones de opción y credenciales de admin.
  - Mensajes de error específicos con ejemplos de formato y validación en vivo.
- **Navegación jerárquica** con migas de pan en cada pantalla interna.
- **Diseño responsive** para escritorio, tablet (≤ 900 px) y móvil (≤ 640 px),
  con menú hamburguesa en pantallas pequeñas.

## Estructura del proyecto

```
├── index.html          # Página de inicio: servicio, pasos y servicios
├── solicitud.html      # Asistente de solicitud en 3 pasos + confirmación
├── consulta.html       # Consulta de estado del trámite con datos reales
├── requisitos.html     # Requisitos, tiempos de entrega y costos
├── admin.html          # Panel administrativo para funcionarios
├── css/
│   └── style.css       # Estilos, puntos de quiebre responsive
├── js/
│   ├── validaciones.js # Reglas de validación del lado del cliente
│   └── main.js         # Navegación, asistente, consulta, admin y localStorage
├── .gitignore          # Archivos ignorados por Git
└── README.md
```

## Instalación y despliegue

El prototipo es un sitio **estático**: no requiere servidor de aplicaciones ni base de datos.

**Opción 1 — Abrir directamente**
1. Clonar o descargar el repositorio.
2. Abrir `index.html` en cualquier navegador moderno.

> Nota: si el navegador bloquea `localStorage` al abrir archivos locales (`file://`), se recomienda usar un servidor local.

**Opción 2 — Servidor local (recomendado)**
```bash
# Con Python 3
python -m http.server 8000
# Luego abrir http://localhost:8000
```

```bash
# Con Node.js (si está instalado)
npx serve .
```

**Opción 3 — GitHub Pages**
1. Subir el código a un repositorio de GitHub.
2. En *Settings → Pages*, elegir la rama `main` y la carpeta raíz.
3. El sitio quedará disponible en `https://<usuario>.github.io/<repositorio>/`.

## Uso

### Como ciudadano

1. **Solicitar la constancia:** desde el inicio, pulsar *«Iniciar solicitud en línea»* y
   completar los tres pasos. El sistema valida cada campo; no es posible avanzar con datos
   inválidos. Al finalizar se guarda la solicitud en `localStorage` y se muestra el número de expediente.
2. **Consultar el estado:** pulsar *«Consultar estado»* e ingresar el número de expediente
   con el formato `ACO-AAAA-0000` (por ejemplo, `ACO-2026-0001`). Si el expediente existe, se muestran
   los datos reales de la solicitud y la línea de tiempo poblada con el estado actual.

### Como funcionario administrativo

1. Abrir directamente la URL `admin.html` (por ejemplo, `http://localhost:8000/admin.html`).
   El enlace no aparece en la navegación pública porque el portal ciudadano y el backoffice
   administrativo serían sistemas separados en una implementación real.
2. Ingresar las credenciales por defecto:
   - **Usuario:** `admin`
   - **Contraseña:** `admin123`
3. En el panel se muestra la tabla de solicitudes almacenadas en `localStorage`, con estadísticas
   por estado. Use el selector de estado en cada fila para cambiar entre: **Recibida → En revisión → Lista para entrega → Entregada**.
4. Pulsar **Cerrar sesión** para volver a la pantalla de login.

## Almacenamiento

Las solicitudes se guardan en el navegador mediante `localStorage`, bajo la clave `acoyapa_solicitudes`.
Cada registro incluye datos del registrado, solicitante, entrega y metadatos (`expediente`, `fechaSolicitud`, `estado`).
El contador de expedientes se almacena en `acoyapa_contador`. El acceso administrativo se marca con
`acoyapa_admin_session`.

> **Importante:** como es un prototipo educativo, los datos se guardan solo en el dispositivo local
> y se pierden si se borra el almacenamiento del navegador. No hay backend ni base de datos remota.

## Datos de prueba sugeridos

| Campo | Valor de ejemplo |
|---|---|
| Cédula | `001-280690-0001A` |
| Teléfono | `8888-8888` |
| N.º de expediente | `ACO-2026-0001` |
| Credenciales admin | `admin` / `admin123` |

## Tecnologías

HTML5 semántico · CSS3 (Grid, Flexbox, media queries) · JavaScript vanilla (sin frameworks ni dependencias).

## Alcance

Conforme a la afirmación de ámbito del proyecto, esta fase **no incluye** pasarela de pago en
línea, firma electrónica ni backend real. El módulo administrativo utiliza autenticación simulada
en el cliente con fines demostrativos.

## Navegación jerárquica

```
Inicio
├── Solicitar constancia
│   └── Paso 1 → Paso 2 → Paso 3 → Confirmación
├── Consultar estado
│   └── Resultado de la consulta
├── Requisitos

> **Área institucional (admin):** en el prototipo se accede directamente a `admin.html` con fines
> demostrativos. En producción sería un backoffice separado, no vinculado desde el portal ciudadano.
```
