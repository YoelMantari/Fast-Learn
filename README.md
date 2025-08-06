# FastLearn App - JavaScript Mobile Version

Esta es la versión JavaScript/Web de la aplicación FastLearn, convertida desde la versión original en Kotlin para Android.

## Características

- 📱 **Compatible con móviles**: Diseño responsivo que funciona en smartphones y tablets
- 🌐 **Progressive Web App (PWA)**: Se puede instalar como una app nativa en el móvil
- 📂 **Integración con GitHub**: Carga preguntas directamente desde repositorios de GitHub
- 🎯 **Interfaz intuitiva**: Experiencia de usuario optimizada para pantallas táctiles
- 📶 **Funciona offline**: Las preguntas descargadas se pueden revisar sin conexión

## Cómo usar

1. **Abrir la aplicación**: Abre `index.html` en un navegador web
2. **Cargar preguntas**: Presiona "📂 Cargar desde GitHub" para navegar por el repositorio
3. **Seleccionar archivo**: Elige un archivo `.txt` o `.md` con preguntas formateadas
4. **Responder preguntas**: Selecciona una opción y presiona "✅ Enviar Respuesta"
5. **Ver feedback**: Revisa la explicación y continúa con la siguiente pregunta

## Formato de preguntas

Las preguntas deben estar en el siguiente formato:

```
🧠 Pregunta 1
¿Cuál es la capital de Francia?

A. Londres
B. Madrid
C. París
D. Roma

✅ Correcta: C
🧾 Explicación: París es la capital y ciudad más poblada de Francia.

🧠 Pregunta 2
...
```

## Instalación como PWA

### En Android:
1. Abre la app en Chrome
2. Toca el menú (⋮) > "Agregar a pantalla de inicio"
3. Confirma la instalación

### En iOS:
1. Abre la app en Safari
2. Toca el botón de compartir
3. Selecciona "Agregar a pantalla de inicio"

## Desarrollo local

Para probar la aplicación localmente:

```bash
# Servir los archivos con un servidor HTTP simple
# Python 3:
python -m http.server 8000

# Node.js (con http-server):
npx http-server

# Luego visita: http://localhost:8000
```

## Diferencias con la versión Kotlin

### Ventajas de la versión JavaScript:
- ✅ Funciona en cualquier dispositivo con navegador
- ✅ No requiere instalación desde Play Store
- ✅ Actualizaciones automáticas
- ✅ Funciona en iOS y Android
- ✅ Menor tamaño de descarga

### Características equivalentes:
- ✅ Navegación por directorios de GitHub
- ✅ Carga de archivos .txt y .md
- ✅ Parseo de preguntas con emojis
- ✅ Mezcla aleatoria de preguntas y opciones
- ✅ Feedback inmediato con explicaciones
- ✅ Interfaz de usuario similar

## Tecnologías utilizadas

- **HTML5**: Estructura semántica y accesible
- **CSS3**: Estilos modernos con gradientes y animaciones
- **JavaScript ES6+**: Lógica de la aplicación con async/await
- **Fetch API**: Comunicación con la API de GitHub
- **Service Workers**: Funcionalidad offline y PWA
- **Web App Manifest**: Metadatos para instalación como app

## Estructura del proyecto

```
FastApp/
├── index.html          # Página principal
├── styles.css          # Estilos CSS
├── app.js             # Lógica JavaScript
├── manifest.json      # Manifest PWA
├── sw.js             # Service Worker
└── README.md         # Este archivo
```

## Compatibilidad

- ✅ Chrome/Chromium (Android/Desktop)
- ✅ Safari (iOS/macOS)
- ✅ Firefox (Android/Desktop)
- ✅ Edge (Windows/Android)

## Autor

Convertido de la versión original en Kotlin para Android.
