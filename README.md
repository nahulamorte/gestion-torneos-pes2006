# Regional T — Manager

Una pequeña aplicación web para gestionar una liga de PES (ej. "Liga PES 2006"). Está pensada para uso local (sin servidor): toda la información se guarda en el navegador (localStorage). Ideal para administrar posiciones, cargar resultados, llevar un historial de partidos y sortear equipos.

## Contenido y estructura del proyecto

- index.html — Interfaz de usuario principal.
- styles/styles.css — Estilos de la aplicación.
- js/script.js — Lógica de la aplicación (persistencia, cálculos, UI).

(El proyecto es estático: basta con abrir `index.html` en un navegador moderno.)

## Qué hace el sistema

- Mantiene un plantel (roster) de participantes: nombre y equipo.
- Permite cargar resultados de partidos (partido entre Persona A y Persona B), indicando goles, goleadores y tarjetas rojas.
- Calcula automáticamente la Tabla de Posiciones con PTS, PJ, PG, PE, PP, GF, GC y DG.
- Lleva el registro de goleadores y tarjetas rojas agregadas por partido.
- Genera un fixture/fechas por semana (la app maneja una fecha de inicio de torneo para avanzar semanas).
- Incluye una herramienta de "Sorteo de Equipos": se cargan listas de personas y equipos y al sortear se asigna un equipo a cada persona.
- Historial de partidos con posibilidad de edición/gestión desde el Modo Admin.
- Persistencia: todos los datos se guardan en localStorage del navegador; no se requiere base de datos ni servidor.

## Modo Admin

- Existe un modo administrador para cargar/editar partidos y gestionar el plantel.
- Credenciales por defecto (definidas en `js/script.js`):
- Al iniciar sesión en Admin se habilitan controles adicionales: botón de cerrar sesión, pestaña "Admin" y formularios de carga/edición.
- Para desactivar el modo admin, usar el botón "Cerrar Sesión".



## Uso rápido

1. Abrir `index.html` desde el navegador.
2. En la parte superior elegir el usuario activo (¿Quién sos?).
3. Navegar entre pestañas:
   - Posiciones: ver la tabla actualizada automáticamente.
   - Goleadores: ranking de goleadores por jugador virtual/persona.
   - Tarjetas Rojas: ranking de expulsiones.
   - Fechas: ver el fixture/fechas por semana para el usuario activo.
   - Sorteo: generar/recargar planteles y asignar equipos al azar a las personas.
   - Admin: (oculto hasta autenticarse) cargar resultados, agregar goleadores/rojas y gestionar roster.
4. Guardar partidos desde el formulario de Admin para que se actualicen las tablas y el historial.

## Persistencia y restauración

- Todos los datos se almacenan en localStorage bajo claves definidas en `js/script.js` (por ejemplo `pes_roster`, `pes_partidos`, `pes_pool_personas`, `pes_pool_equipos`, etc.).
- Si no hay datos guardados, la aplicación crea datos de ejemplo (seed) para arrancar.
- Para "resetear" la aplicación borrar las claves relacionadas en localStorage (o vaciar el almacenamiento del sitio desde las herramientas del navegador).

## Personalización y desarrollo

- Cambiar equipos/participantes: ir a la pestaña Sorteo o editar el roster desde Admin.
- Cambiar credenciales admin: editar las constantes `ADMIN_USER` y `ADMIN_PASS` en `js/script.js`.
- La lógica de cálculo de posiciones, goleadores y expulsiones está en `js/script.js` (funciones `calcularPosiciones`, `calcularGoleadores`, `calcularRojas`).

## Requisitos

- Navegador moderno con soporte para localStorage (Chrome, Firefox, Edge, Safari).
- No requiere servidor ni instalación.


Interfaz y lógica creada para la gestión de una liga de PES 2006/2026 (proyecto personal).

---


