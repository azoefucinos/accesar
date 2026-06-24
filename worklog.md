# AccesAR — Worklog

Plataforma colaborativa para identificar y visibilizar barreras urbanas de accesibilidad. MVP funcional construido con Next.js 16 + TypeScript + Tailwind 4 + shadcn/ui + Prisma (SQLite) + z-ai-web-dev-sdk (VLM).

---
Task ID: 1
Agent: main (Z.ai Code)
Task: Construcción completa del MVP de AccesAR desde cero.

Work Log:
- Definí el schema Prisma `Report` (category, severity, description, address, neighborhood, lat, lng, imageUrl, status, timestamps) con índices y `db:push`.
- Generé 6 imágenes representativas de barreras urbanas con el skill image-generation (rampa, vereda, obstáculo, cruce, acceso, accesible) en `public/reports/`.
- Creé seed script (`prisma/seed.ts`) con 56 reportes realistas distribuidos en 15 barrios de Buenos Aires, fechas en últimos 6 meses, descripciones por categoría y severidad ponderada. Ejecutado: 56 reportes en base.
- Construí lib de tipos (`types.ts`), constantes (`constants.ts`: 6 categorías, 15 barrios con coordenadas reales, colores rojo/amarillo/verde por severidad, bounds de proyección).
- Implementé 5 rutas API:
  - `GET/POST /api/reports` (listado con filtros + creación con validación).
  - `POST /api/classify` (VLM con z-ai-web-dev-sdk createVision; prompt JSON estricto; normalización de categoría/severidad; fallback a simulación determinista si el SDK falla).
  - `GET /api/stats` (KPIs + por categoría/severidad/barrio + evolución mensual 6 meses + tendencia 14 días).
  - `GET /api/neighborhoods` (índice 0-100 por barrio con fórmula `100 - grave*12 - moderada*6 + accesible*4`, niveles crítico/atención/aceptable/óptimo).
  - `GET /api/recommendations` (recomendaciones urbanas automáticas por barrio+categoría con prioridad alta/media/baja).
- Diseñé paleta esmeralda (accesibilidad = verde) en `globals.css` con modo claro/oscuro, scrollbar estilizada, grid-pattern y utilidades.
- Shell de la app: `Providers` (ThemeProvider + QueryClient), `Header` sticky con nav desktop y nav móvil scrollable, `Footer` sticky con `mt-auto`, `Logo` SVG. Store Zustand para vista + filtros + selección.
- Mapa interactivo custom (`city-map.tsx`): SVG con proyección lat/lng→coordenadas, grilla de calles, río, parques, etiquetas de barrios, marcadores coloreados por severidad, zoom/pan con pointer events, leyenda, controles.
- 6 vistas: Home (hero + impacto dinámico + "por qué existe" + CTA), Mapa (filtros + mapa + lista + panel detalle con foto/ubicación/categoría/descripción/fecha), Reportar (foto con resize canvas, GPS, dirección manual, categorías, IA classify, confirmación), Índice (ranking + comparador + recomendaciones), Estadísticas (4 KPIs + 4 gráficos recharts: barras categorías, donut severidad, barras horizontales barrios, área evolución + tendencia 14 días), Sobre (misión/visión/objetivo + cómo funciona + principios + tecnología).
- Corregí errores de lint (acceso a ref durante render → estado `dragging`; directivas eslint-disable no usadas). Lint limpio.
- QA con agent-browser: home renderiza con stats (56/15/36/20), mapa con 56 marcadores clickeables + panel detalle, flujo de reporte completo (56→57 reportes, pantalla de confirmación, "ver en mapa" funciona), classify API devolvió categoría+severidad+confianza 0.9+razonamiento, índice con 15 barrios, estadísticas con 8 gráficos, sobre renderiza. Layout responsive + footer sticky verificados (sticks en viewport alto, push natural en overflow). Sin errores de runtime.

Stage Summary:
- MVP 100% funcional y verificado end-to-end en el navegador.
- Stack: Next.js 16 App Router, TypeScript, Tailwind 4, shadcn/ui, Prisma/SQLite, Zustand, TanStack Query, recharts, z-ai-web-dev-sdk (VLM).
- 6 imágenes generadas, 56 reportes sembrados (+1 de QA = 57), 5 endpoints API, 6 vistas, mapa SVG interactivo custom.
- Cobertura de TODAS las funcionalidades solicitadas: home con stats dinámicas, mapa con marcadores y filtros, reporte con IA, índice de accesibilidad, estadísticas, sobre el proyecto, + extras creativos (ranking, comparador, recomendaciones automáticas).
- Lint limpio, dev server estable en puerto 3000, sin errores de runtime.

Estado actual: ESTABLE. Listo para iteración.

Próximas mejoras sugeridas (fase 2):
- Persistencia de foto de reporte en disco/S3 en lugar de data URL en DB.
- Exportar datos abiertos (CSV/GeoJSON) desde /api/reports.
- Filtros por rango de fechas en mapa y estadísticas.
- Detalle de barrio (vista individual) con historial de reportes.
- Modo oscuro con toggle visible en el header (la infraestructura next-themes ya está).
- Métricas de evolución del índice de accesibilidad en el tiempo.
- PWA / instalación móvil para uso en campo.

---
Task ID: 2
Agent: main (Z.ai Code) — cron webDevReview
Task: QA + añadir features (modo oscuro, export CSV/GeoJSON, vista de barrio, heat zones) + mejorar styling.

Work Log:
- QA inicial con agent-browser: las 6 vistas renderizan sin errores de runtime. Identifiqué que el nav móvil horizontal overflowaba (scrollWidth 551 vs visible 233) y, vía VLM, detecté bajo contraste en texto secundario, touch targets <48px y falta de profundidad en tarjetas.
- **Modo oscuro**: habilité `enableSystem` en ThemeProvider, creé `ThemeToggle` (botón con Sun/Moon, hidratación segura) y lo integré en el header (desktop y móvil). Verificado: `document.documentElement.className` cambia a "dark".
- **Navegación móvil rediseñada**: reemplacé el nav scroll horizontal por una **bottom nav fija** (`MobileNav`) con 6 items, ícono central de "Reportar" elevado (estilo app móvil), safe-area inset, y `pb-16` en main para evitar superposición. Mejora UX táctil y resuelve el overflow.
- **Exportación de datos abiertos**: nuevo endpoint `GET /api/reports/export?format=csv|geojson` con filtros (category/severity/neighborhood). CSV con BOM UTF-8 + 13 columnas + escape; GeoJSON FeatureCollection con CRS84. Componente `ExportButton` (dropdown CSV/GeoJSON con toast de confirmación). Integrado en Mapa (respeta filtros activos) y Estadísticas. Verificado: CSV 16KB, GeoJSON 29KB, content-types correctos.
- **Vista de detalle de barrio** (`neighborhood-view.tsx`): nueva vista `barrio` en el store con `openNeighborhood()`. Muestra header con score + nivel + barra de progreso, 4 KPIs (total/graves/moderadas/accesibles), 2 gráficos recharts (barreras por categoría con colores por tipo + evolución semanal de 13 semanas), recomendaciones filtradas por barrio, e historial completo de reportes con foto/thumbnail. Ranking del índice ahora es clickeable (medallas oro/plata/bronce top 3) y los cards del comparador también abren el detalle.
- **Detección automática de zonas críticas**: función `computeCriticalZones()` que agrupa reportes por barrio y calcula intensidad (`grave*0.4 + total*0.1`). Toggle con ícono Flame en el mapa que renderiza heat zones como círculos radiales con gradiente rojo→ámbar (radio e intensidad según gravedad). Verificado: 10 zonas críticas detectadas.
- **Mejoras de styling**:
  - `globals.css`: muted-foreground más oscuro (oklch 0.45) para contraste WCAG AA, foreground más profundo (0.19), variables `--shadow-card` y `--shadow-card-hover`.
  - Nuevas utilidades: `card-elevated` (sombra + hover), `card-hover-lift` (translateY -2px), `animate-count-up`, `animate-fade-in-up`, `no-scrollbar`.
  - Home: tarjetas de impacto con ícono en contenedor redondeado + animación count-up; tarjetas "por qué existe" con hover-lift; nueva sección **"Reportes recientes"** (6 cards con foto/categoría/severidad/fecha que enlazan al mapa).
  - Índice: ranking con medallas top-3 y chevron, barras de progreso animadas, cards comparador clickeables con hover scale.
- Lint limpio. Dev server compila sin errores. QA final: 6 vistas OK, dark mode OK, export OK, heat zones OK (10 zonas), barrio detail OK (2 charts + 4 KPIs + 3 history items), mobile bottom nav OK, submit no bloqueado.

Stage Summary:
- 4 features nuevas: modo oscuro, export CSV/GeoJSON, vista detalle de barrio, heat zones de zonas críticas.
- Styling mejorado: contraste WCAG AA, sombras/profundidad en tarjetas, animaciones sutiles, bottom nav móvil, sección de reportes recientes en home.
- 1 nuevo endpoint API (`/api/reports/export`), 1 nueva vista (`neighborhood-view`), 2 nuevos componentes (`ThemeToggle`, `ExportButton`, `MobileNav`).
- Estado: ESTABLE. Todas las features verificadas end-to-end.

Próximas mejoras sugeridas (fase 3):
- Filtros por rango de fechas en mapa y estadísticas.
- Búsqueda/filtro de barrios en el ranking del índice.
- Persistencia de foto de reporte en disco/S3 (data URL en DB actualmente).
- PWA con service worker para uso offline en campo.
- Métricas de evolución del índice de accesibilidad en el tiempo (comparar mes a mes).
- Vista de detalle de reporte individual (al hacer click en un reporte del historial).
- Compartir reporte/barrio por URL (state en query params).

---
Task ID: 3
Agent: main (Z.ai Code) — cron webDevReview
Task: QA + fase 3 (filtros por fecha, modal de reporte, búsqueda de barrios, compartir por URL, insight automático, polish de styling).

Work Log:
- QA inicial con agent-browser: las 7 vistas (incluida barrio) renderizan sin errores. VLM sugirió unificar espaciado de tarjetas y mejorar jerarquía. Capturas guardadas en download/qa3-*.png.
- **Filtros por rango de fechas**: nuevo `DatePreset` en el store (`all|7d|30d|90d|180d`). Componente `DateFilter` (segmented control con ícono Calendar). Integrado en Mapa (respeta filtros + export) y Estadísticas. APIs `/api/reports` y `/api/stats` ahora aceptan `?days=N`. Verificado: mapa 57→2 reportes con 7d, stats KPIs 57→2.
- **Modal de detalle de reporte** (`ReportDetailDialog`): dialog full con foto grande, badge de severidad, cards de ubicación/fecha, descripción, coordenadas, y 3 acciones (Ver barrio, Ver en mapa, Compartir con Web Share API + fallback a clipboard). Botón "Ver detalle completo" en el panel lateral del mapa lo abre. Verificado: dialog abre con heading + share button.
- **Búsqueda y filtro de barrios en el índice**: input de búsqueda por nombre + chips de filtro por nivel (Todos/Óptimo/Aceptable/Atención/Crítico). Ranking usa `filteredList` con empty state. Verificado: "Pal" → 1 resultado (Palermo), chip "Crítico" → empty state.
- **Compartir barrio por URL (deeplink)**: hook `useUrlSync` que sincroniza `view` + `selectedNeighborhood` con query params (`?v=barrio&barrio=Nombre`). Lee params al montar (deeplink) y escribe al navegar. Botón Share2 en el header del barrio (Web Share API + fallback clipboard). Verificado: `?v=barrio&barrio=Caballito` abre directamente la vista de Caballito.
- **Mejoras de styling**:
  - KPIs de estadísticas con íconos en contenedores de color redondeados + `animate-count-up` + `card-elevated`.
  - Nuevo panel **"Insight del período"** auto-generado en estadísticas: resume la barrera más frecuente con %, cantidad de graves, y barrio con más reportes.
  - Export de estadísticas respeta el filtro de días.
- Lint limpio. Dev server compila sin errores. QA final: 6 vistas OK, date filter OK (mapa + stats), dialog OK, search OK, deeplink OK, insight OK, sin errores de runtime.

Stage Summary:
- 5 features nuevas: filtros por fecha (mapa+stats), modal de reporte, búsqueda de barrios, deeplink/compartir por URL, insight automático.
- 2 APIs extendidas con `?days=N` (`/api/reports`, `/api/stats`), 1 nuevo endpoint implícito vía export.
- 3 nuevos componentes (`DateFilter`, `ReportDetailDialog`, hook `useUrlSync`).
- Estado: ESTABLE. Todas las features verificadas end-to-end con agent-browser.

Próximas mejoras sugeridas (fase 4):
- Vista de detalle de reporte por deeplink (`?report=id`) además del barrio.
- PWA con service worker para uso offline en campo.
- Persistencia de foto en disco/S3 (data URL en DB actualmente).
- Evolución temporal del índice de accesibilidad (comparar mes a mes por barrio).
- Export PDF de informe por barrio.
- Mapa de calor por categoría (no solo gravedad).
- Notificaciones/push cuando se reporta cerca de una zona de interés.



---
Task ID: 4
Agent: main (Z.ai Code) — sesión de usuario
Task: Reemplazar mapa SVG por OpenStreetMap+Leaflet, eliminar reportes/fotos inventadas, arreglar logo, sacar secciones de about, hacer reportes reales y rápidos. Luego: sacar "Evolución temporal", no mostrar barrios sin datos como "mejores", arreglar z-index del mapa, agregar eliminar reporte, sacar exportar. Luego: sacar "OpenStreetMap" y "MVP", auto-detectar barrio al escribir dirección, arreglar botón eliminar en pantalla.

Work Log:
- **Mapa real con OpenStreetMap + Leaflet**: instalé `leaflet` + `react-leaflet` + `@types/leaflet`. Creé `city-map.tsx` (wrapper con `dynamic(ssr:false)` porque Leaflet usa `window`) y `city-map-inner.tsx` (MapContainer + TileLayer OSM + marcadores DivIcon coloreados por severidad + popups con foto/dirección/descripción + Circle para heat zones + controles custom de zoom/locate + leyenda). Importé `leaflet/dist/leaflet.css` en layout.tsx.
- **Eliminé todos los reportes inventados**: borré las 56+ imágenes AI en `/public/reports/`, eliminé los 57 reportes de la DB, y reescribí `prisma/seed.ts` para que solo limpie (no genere datos falsos). La DB queda vacía — todos los reportes ahora son reales, creados por personas.
- **Arreglé el logo**: el SVG era blanco sobre blanco en modo claro. Ahora tiene fondo esmeralda sólido (gradiente #10b981→#059669) con trazos blancos, visible en ambos modos. Quité el `bg-primary` duplicado del contenedor en header y home.
- **Saqué secciones de about**: eliminé "Principios de diseño" y "Tecnología" de `about-view.tsx`. Quedan: Misión/Visión/Objetivo, Cómo funciona, CTA.
- **Hero dinámico**: la tarjeta del hero ahora muestra los 4 reportes más recientes reales, o un estado vacío ("Sé la primera persona en reportar") cuando no hay reportes.
- **Saqué "Evolución temporal de reportes"** de stats-view (AreaChart mensual + tendencia 14 días). Limpié imports (AreaChart, Area, Badge). Quedan: KPIs, Insight, Barreras frecuentes, Distribución por severidad, Distribución geográfica.
- **Saqué exportar datos**: eliminé `export-button.tsx`, `api/reports/export/route.ts`, y los botones de export en map-view y stats-view.
- **Barrios sin datos = "sin_datos"**: la API `/api/neighborhoods` ahora devuelve level `sin_datos` (score 0) para barrios sin reportes, y los ordena al final. El "mejor" y "peor" del index-view solo consideran barrios con datos. Si no hay datos, muestra "—" con "Sin datos aún". Añadí chip "Sin datos" al filtro de nivel y nivel `sin_datos` a LEVEL_META.
- **Arreglé z-index del mapa**: añadí `isolation: isolate` + `z-index: 0` al wrapper del mapa, `zoomControl={false}` (uso controles custom), y CSS fuera de `@layer` para forzar `.leaflet-pane/.leaflet-control` a `z-index:1 !important`. Ahora los selects (barrio) aparecen arriba del mapa y el scroll no superpone.
- **Eliminar reporte**: creé `DELETE /api/reports/[id]` (cualquiera puede eliminar, MVP colaborativo). Añadí botón "Eliminar reporte" en `ReportDetailDialog` con `AlertDialog` de confirmación, useMutation + invalidateQueries. El dialog ahora es scrollable (`max-h-[55vh] overflow-y-auto`) para que el botón eliminar siempre entre en pantalla.
- **Saqué "Plataforma cívica de impacto social · MVP"** del badge del hero del home.
- **Saqué "OpenStreetMap"**: quité el texto de la leyenda custom, vacié el `attribution` de los TileLayer, y oculté `.leaflet-control-attribution` con CSS fuera de `@layer` (`display:none !important`). Verificado via DOM que `offsetParent===null`.
- **Auto-detectar barrio al escribir dirección**: creé `GET /api/geocode?q=...` que usa Nominatim (OpenStreetMap) con viewbox limitado a CABA, devuelve lat/lng + neighborhood (match por nombre en address o por cercanía). En report-view, un useEffect con debounce de 700ms llama al geocode y muestra una sugerencia "Barrio sugerido: X" con botón "Usar" que autocompleta barrio + coords. Placeholder actualizado a "Ej: Av. Santa Fe 1234, Palermo".
- **Botón eliminar compacto**: cambié de `ghost` full-width con border-top a `ghost` compacto, y el contenido del dialog ahora es scrollable (`max-h-[55vh] overflow-y-auto`) para que en pantallas chicas el botón siempre sea accesible.
- QA con agent-browser: mapa real carga con calles, select de barrio abre encima del mapa, scroll no superpone, reporte fluye completo (dirección→sugerencia→barrio auto→mapa→submit→mapa→detalle→eliminar), dialog de eliminar entra en pantalla, confirmación visible, home sin "MVP" en hero, mapa sin "OpenStreetMap", índice muestra "—" cuando no hay datos. Sin errores de runtime.

Stage Summary:
- Mapa real funcionando con OpenStreetMap (calles, zoom, popups, heat zones).
- Base de datos limpia: 0 reportes inventados, todos los reportes son reales.
- Logo visible en modo claro y oscuro.
- About sin "Principios de diseño" ni "Tecnología".
- Stats sin "Evolución temporal" ni exportar.
- Índice no muestra barrios sin datos como "mejores".
- Mapa no se superpone con selects ni contenido al hacer scroll.
- Eliminar reporte funcional con confirmación y dialog scrollable.
- Auto-detección de barrio al escribir la dirección (Nominatim).
- Sin "MVP" en hero, sin "OpenStreetMap" visible en el mapa.
- Estado: ESTABLE. Lint limpio, dev server en puerto 3000, sin errores de runtime.

Próximas mejoras sugeridas:
- Confirmación visual (ej: hover preview) al seleccionar ubicación en el mapa de reporte.
- Editar reporte (no solo eliminar).
- Validar que la dirección ingresada esté realmente dentro de CABA antes de aceptar.
- Filtros en el mapa por fecha y categoría sincronizados con la URL.
- PWA para uso offline en campo.

---
Task ID: 5
Agent: main (Z.ai Code) — sesión de usuario
Task: Fix bug "cuando no hay reportes, igual figura como reporte uno en palermo (pasa cuando agrego otro reporte, ej nazca 555, dpsues lo borro, pero en el indice aparece un reoprte en palermo que no deberia aparecer)"

Work Log:
- **Investigación profunda del bug**:
  - Verifiqué estado de la DB: 0 reportes (vacía tras las pruebas del usuario).
  - Verifiqué la API `/api/neighborhoods` directamente con curl: devuelve `totalReports: 0` para todos los barrios (incluido Palermo) — el backend es correcto.
  - Reproduje el flujo exacto del usuario con agent-browser: crear reporte "Nazca 555" (geocode lo asigna correctamente a Flores), visitar índice, eliminar reporte, visitar índice de nuevo.
  - **Causa raíz identificada**: Cuando todos los barrios tienen 0 reportes, el ranking del index-view mostraba "1 Palermo 0/100 Sin datos 0 reportes 0 graves 0 accesibles". El número "1" al inicio es el **rank** (posición en la lista), NO la cantidad de reportes. Pero visualmente "1 Palermo" se lee como "1 reporte en Palermo". Palermo aparecía primero porque `NEIGHBORHOODS[0]` es Palermo y el sort preservaba el orden original cuando todos los barrios tenían el mismo score=0/level=sin_datos.
  - **Causa raíz secundaria**: La query key `["reports-by-neighborhood", selectedNeighborhood]` (usada por neighborhood-view) **NO se invalidaba** al crear o eliminar reportes. Esto podía causar que el "Historial de reportes" de la vista de barrio muestre datos obsoletos después de crear/eliminar.

- **Fix 1 — API neighborhoods sort alfabético para sin_datos**:
  - En `/api/neighborhoods/route.ts`, el sort ahora ordena los barrios sin datos alfabéticamente (en vez de preservar el orden de declaración). Así Palermo no siempre aparece primero cuando todos tienen sin_datos.

- **Fix 2 — Index-view: estado vacío y separación de barrios sin datos**:
  - Cuando `rankedList` (barrios con datos) está vacío, se muestra un **estado vacío claro**: "Aún no hay reportes en la plataforma / Los barrios aparecerán en el ranking a medida que la comunidad reporte barreras urbanas." con un link "Ver un barrio igualmente".
  - Cuando hay barrios con datos, el ranking numérico (con medallas oro/plata/bronce top-3) **solo incluye barrios con datos reales**.
  - Los barrios sin datos se muestran en una **sección separada** "Sin reportes aún (N)" como chips compactos (sin número de ranking), evitando la confusión de leer "1 Palermo" como "1 reporte en Palermo".

- **Fix 3 — Cache invalidation para reports-by-neighborhood**:
  - En `report-view.tsx` (createMutation onSuccess): añadí `qc.invalidateQueries({ queryKey: ["reports-by-neighborhood"] })` y también `["reports-recent-home"]` que faltaba.
  - En `report-detail-dialog.tsx` (deleteMutation onSuccess): añadí `qc.invalidateQueries({ queryKey: ["reports-by-neighborhood"] })`.
  - Esto asegura que la vista de barrio (neighborhood-view) siempre muestre datos frescos después de crear/eliminar reportes.

- **Verificación con agent-browser**:
  - Estado vacío (0 reportes): índice muestra "—" para mejor/peor, estado vacío "Aún no hay reportes en la plataforma", 0 items rankeados. ✓
  - 1 reporte en Flores: índice muestra "1 Flores 88/100 Óptimo 1 reportes" en ranking, 14 barrios (incluido Palermo) como chips en "Sin reportes aún (14)". ✓
  - 1 reporte en Palermo: índice muestra "1 Palermo 88/100 Óptimo 1 reportes" en ranking (correcto — hay un reporte real). ✓
  - Después de eliminar: índice vuelve a estado vacío. ✓
  - Neighborhood-view Palermo después de eliminar reporte: "Historial de reportes (0)" (cache invalidado correctamente). ✓
  - DB final: 0 reportes. ✓

Stage Summary:
- **Bug principal corregido**: Cuando no hay reportes, el índice ya NO muestra "1 Palermo" como rank #1. Muestra un estado vacío claro en su lugar.
- **Bug de cache corregido**: `["reports-by-neighborhood"]` ahora se invalida al crear/eliminar reportes, evitando datos obsoletos en la vista de barrio.
- **UX mejorada**: Barrios sin datos se muestran como chips compactos en una sección separada, no como items rankeados.
- **Sort alfabético**: Barrios sin datos se ordenan alfabéticamente en la API (defensivo).
- Lint limpio, dev server estable, sin errores de runtime.
- Estado: ESTABLE.

Próximas mejoras sugeridas:
- Confirmación visual (hover preview) al seleccionar ubicación en el mapa de reporte.
- Editar reporte (no solo eliminar).
- Validar que la dirección ingresada esté realmente dentro de CABA antes de aceptar.
- PWA para uso offline en campo.
- Mostrar contador de "última actualización" o timestamp de refresh en el índice.

---
Task ID: 6
Agent: main (Z.ai Code) — sesión de usuario
Task: Preparar todo para deploy en Vercel + Turso (producción pública, cualquiera reporta desde la calle).

Work Log:
- **Instalé adapter Turso**: `@prisma/adapter-libsql` + `@libsql/client` (vía `bun add`).
- **Schema Prisma**: agregué documentación de los 2 modos (local SQLite / Turso). Prisma 6.19.2 marca `driverAdapters` como deprecated (ya no es preview feature), lo dejé fuera.
- **`src/lib/db.ts` reescrito**: detección automática — si `TURSO_DATABASE_URL` empieza con `libsql://` usa el adapter libSQL con `authToken`; si no, usa el SQLite local con logging. Bug corregido: el export correcto es `PrismaLibSql` (S minúscula), no `PrismaLibSQL`.
- **`.env.example`** creado con todas las variables documentadas (DATABASE_URL local, TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, ZAI_API_KEY). `.gitignore` actualizado con `!.env.example` para que sí se suba el ejemplo.
- **`vercel.json`**: framework nextjs, buildCommand `prisma generate && next build`, installCommand `bun install`, API routes con maxDuration 30s.
- **`package.json`**: cambié `build` a `prisma generate && next build`, agregué `postinstall: prisma generate` (clave para Vercel), `start: next start -p 3000`, y `db:push:turso` con las vars de Turso.
- **`scripts/migrate-to-turso.ts`**: script para copiar reportes del SQLite local a Turso (upsert por ID, salta duplicados). Útil si ya hay reportes locales que preservar.
- **`README-DEPLOY.md`**: guía paso a paso completa — crear base en Turso, crear tablas con `db:push:turso`, subir a GitHub, deploy en Vercel con las 3 variables de entorno críticas, verificación post-deploy, troubleshooting.
- **QA**: lint limpio. Dev server re-lanzado con watchdog (sandbox mata `next dev` entre comandos bash, el watchdog lo revive cada 8s). Verificado con agent-browser: home carga HTTP 200, formulario de reporte funcional (inputs de dirección/barrio/categoría/mapa presentes), API `/api/reports` HTTP 200 con query Prisma funcionando. Sin errores de runtime.

Stage Summary:
- Código 100% listo para deploy. No cambié lógica de negocio — solo la capa de conexión a DB.
- Detección automática local vs Turso: la misma base de código funciona en ambos entornos.
- 3 variables de entorno críticas para Vercel: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `DATABASE_URL` (esta última apunta a Turso también).
- Documentación completa en README-DEPLOY.md (~150 líneas, paso a paso).
- Script de migración preserva datos existentes si hace falta.
- Estado: ESTABLE. Listo para `git push` → Vercel.

Próximas mejoras sugeridas:
- PWA con service worker para uso offline en campo (reportes se encolan y sincronizan al recuperar conexión).
- Persistir fotos en disco/S3 en lugar de data URL (reduce tamaño de DB y mejora rendimiento).
- URL fija con dominio propio (accesar.org.ar).
- Backups automáticos de Turso.

---
Task ID: 7
Agent: main (Z.ai Code) — cron webDevReview
Task: QA + añadir PWA completo + feature "Reportes cercanos" con geolocalización + animaciones de transición + skeletons pulidos.

Work Log:
- **QA inicial**: dev server OK, lint limpio, todas las 6 vistas (home, mapa, reportar, indice, estadisticas, sobre) cargan HTTP 200 sin errores de runtime. APIs /api/reports, /api/stats, /api/neighborhoods responden 200. Verificado con agent-browser: todas las vistas renderizan, sin errores de consola.

- **PWA completo (Progressive Web App)**:
  - Generé 8 íconos PNG con sharp desde un SVG derivado del logo existente: `icon-192.png`, `icon-512.png`, `icon-180.png`, `icon-32.png`, `icon-16.png`, `apple-touch-icon.png`, `favicon-32.png`, `icon-maskable-512.png` (con safe-zone para Android). Script `scripts/generate-pwa-icons.ts` + `scripts/logo-pwa.svg`.
  - Generé `og-image.png` 1200x630 con fondo gradiente esmeralda + logo + texto "AccesAR" para sharing social.
  - Creé `public/manifest.json` completo: name/short_name, start_url, display:standalone, theme_color:#10b981, background_color, icons (any + maskable), 3 shortcuts (Reportar/Mapa/Índice con deep links), lang:es-AR.
  - Creé `public/sw.js` service worker: precachea shell (/, manifest, icons), cache-first para assets estáticos, network-first con fallback a cache para API y navegación, ignorar requests de otros orígenes (OSM tiles, Nominatim), no cachea POST/DELETE.
  - Componente `src/components/sw-register.tsx`: registra SW solo en producción, con requestIdleCallback para no bloquear primer render.
  - `src/app/layout.tsx` reescrito: metadata con manifest, appleWebApp, icons (16/32/192/512 + apple-touch), openGraph con og-image 1200x630, twitter card. Viewport con themeColor dual (light #10b981 / dark #064e3b), viewportFit cover. Head con meta tags iOS (apple-mobile-web-app-capable, status-bar-style, title).
  - Verificado: manifest.json sirve HTTP 200, sw.js sirve HTTP 200, og-image sirve HTTP 200, meta tags presentes en HTML (theme-color, manifest, apple-mobile-web-app, og:image).

- **Feature: Reportes cercanos con geolocalización**:
  - Nuevo componente `src/components/nearby-reports.tsx` integrado en home entre "Impacto" y "Reportes recientes".
  - Botón "Usar mi ubicación" → navigator.geolocation.getCurrentPosition con enableHighAccuracy.
  - Manejo de estados: idle, loading, error (con mensajes específicos: PERMISSION_DENIED, POSITION_UNAVAILABLE, TIMEOUT), success.
  - Calcula distancia Haversine a cada reporte, ordena por cercanía, muestra los 6 más cercanos.
  - Cada card muestra: foto/icono, categoría, distancia formateada (m/km), dirección, barrio + severidad.
  - Muestra "Cerca de {barrio}" calculando el barrio más cercano a la ubicación del usuario.
  - Click en card → abre el mapa con ese reporte seleccionado.
  - Estado vacío cuando no hay reportes cercanos: "Sé la primera persona en reportar una barrera en esta zona" con CTA a reportar.

- **Animaciones de transición entre vistas**:
  - `src/app/page.tsx` reescrito con framer-motion AnimatePresence mode="wait".
  - Cada vista entra con fade + slide-up (y:8→0, opacity 0→1), sale con fade + slide-up (y:0→-4, opacity 1→0). Duration 0.22s con cubic-bezier ease.
  - Switch-case reemplaza los condicionales encadenados (más limpio).
  - Verificado: navegación entre todas las vistas sin errores, transiciones suaves.

- **Skeletons y polish visual**:
  - KPIs de "Impacto en números": muestran Skeleton (h-9 w-16) durante statsLoading en lugar del número.
  - Sección "Reportes recientes": muestra 6 skeletons (con foto+texto) durante recentLoading. Antes no aparecía hasta tener datos.
  - Imágenes de reportes recientes: agregué `transition-transform group-hover:scale-105` para sutil zoom al hover.
  - Botón "Usar mi ubicación" con ícono LocateFixed, estados loading (RefreshCw spin) y error (reintentar).

- **QA final**:
  - Lint limpio.
  - Todas las 6 vistas HTTP 200.
  - Manifest, sw.js, iconos, og-image todos sirven 200.
  - Meta tags PWA presentes en HTML head.
  - API POST /api/reports crea reporte correctamente (test de round-trip).
  - API DELETE /api/reports/[id] elimina correctamente.
  - VLM verificó layout: "bien alineado, sin overflow, sin elementos cortados, sección Reportes cercanos bien estructurada".
  - DB queda limpia (0 reportes) tras cleanup.

Stage Summary:
- **PWA completo**: la app ahora es instalable en Android/iOS/desktop. Los usuarios pueden "Agregar a pantalla de inicio" y obtienen una experiencia tipo app nativa (standalone, sin barra del navegador, con theme color esmeralda). Service worker da soporte offline básico para el shell + cache de API.
- **Reportes cercanos**: feature clave para uso en campo. El usuario desde su celu ve qué barreras hay cerca suyo sin tener que navegar el mapa completo.
- **Animaciones framer-motion**: transiciones suaves entre vistas dan sensación de app pulida en lugar de saltos abruptos.
- **Skeletons**: durante cargas se ven skeletons en lugar de espacios vacíos, mejorando perceived performance.
- 4 nuevos componentes (`NearbyReports`, `ServiceWorkerRegister`, scripts `generate-pwa-icons.ts` + `migrate-to-turso.ts` ya existía).
- 9 nuevos assets en public/ (8 PNG icons + manifest.json + sw.js + logo-pwa.svg en scripts).
- Estado: ESTABLE. Listo para uso en campo + deploy.

Próximas mejoras sugeridas (fase 5):
- Background Sync API para encolar reportes creados offline y sincronizar al recuperar conexión.
- Web Push Notifications para alertar cuando se reporta cerca de una zona de interés.
- Compartir reporte por URL con deep link al detalle (`?report=id`) además del barrio.
- Filtros por fecha en la home (mostrar solo reportes de la última semana por defecto).
- Modo "accesible" con texto más grande y alto contraste para usuarios con baja visión.
- Onboarding opcional al primer visitante (¿cómo reportar? ¿cómo funciona el índice?).
