# KALY — sitio de presentación (v1)

Sitio estático HTML/CSS/JavaScript para Cloudflare Pages.

## Estructura
- `index.html`: contenido y estructura de la página.
- `css/style.css`: diseño responsive y paleta KALY.
- `js/script.js`: selector FR/ES/EN y menú móvil.
- `assets/`: logotipo, mascota, iconos y fuente de iconos disponibles.

## Recursos gráficos que ya deben existir en `assets/` del repositorio
El código utiliza estos nombres exactos:
- `KALY_LOGOOK.png`
- `KALY_rond_transp.png`
- `bandeauKALY ok fr.png`
- `bandeauKALY ok es.png`
- `kaly_icon.png`

Los dos banners FR y ES ya estaban en el repositorio GitHub según la captura del usuario. No se incluyen en este paquete porque no estaban adjuntos como archivos locales al generar el código. Conserva esos archivos en `assets/` con esos nombres exactos.

## Tipografía
La paleta y el logotipo oficiales se respetan. El archivo `KALY_Icons.ttf` se incluye como recurso, pero no se aplica como tipografía de texto porque es una fuente de iconos. KALY Display es una variante para ciertos documentos/usos gráficos y no sustituye al logotipo; no se ha recibido un archivo de fuente KALY Display para integrarlo. El sitio utiliza una pila tipográfica de sistema para el texto corrido, evitando cargar fuentes externas. KALY Display se reserva para los usos gráficos/documentales definidos en la identidad; no se aplica como sustituto del logotipo.

## Publicación
1. Copia `index.html`, `css/`, `js/` y el contenido de `assets/` a la raíz del repositorio `cgbarato-kfn/Kaly-website`.
2. No borres los banners FR/ES que ya existen en GitHub.
3. Haz commit en `main`.
4. Cloudflare Pages debería desplegar automáticamente.
5. Revisa `https://kaly-website.pages.dev`.

Configuración Cloudflare Pages para HTML estático:
- Build command: vacío
- Build output directory: `.`
- Root directory: vacío

## Nota sobre el alcance
Esta web presenta el proyecto. No incluye autenticación, Firebase, almacenamiento de datos, diagnóstico ni recomendaciones médicas.
