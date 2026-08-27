# Landing Page — Asesoría en Análisis Financiero Inmobiliario

Landing page estática (HTML + CSS + JS puro, sin frameworks ni build step).
Lista para subir a GitHub y desplegar en Vercel.

## Estructura del proyecto

```
landing/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── script.js
└── README.md
```

## Antes de publicar — pendientes a configurar

1. **Enlace de agenda**: en `index.html` hay dos botones que apuntan a `#`:
   - `id="cta-agendar-btn"` (sección CTA final)
   Reemplaza el `href="#"` por tu enlace real, por ejemplo:
   - WhatsApp: `https://wa.me/52XXXXXXXXXX?text=Quiero%20agendar%20mi%20asesor%C3%ADa`
   - Calendly / otro calendario: `https://calendly.com/tu-usuario/asesoria`
2. **Imágenes**: actualmente usa fotos de stock de Unsplash (enlazadas directo, no descargadas). Puedes dejarlas o sustituirlas por fotos reales tuyas (terrenos, planos, oficina) colocándolas en una carpeta `img/` y actualizando las rutas `src` en `index.html`.
3. **Datos de contacto / redes** (opcional): agrega tu WhatsApp, Instagram o correo en el footer si lo deseas.

---

## Paso 1 — Subir el proyecto a GitHub

1. Crea una cuenta en [github.com](https://github.com) si no tienes una.
2. Crea un repositorio nuevo:
   - Ve a github.com → botón **New repository**.
   - Nómbralo, por ejemplo: `landing-asesoria-inmobiliaria`.
   - Déjalo **público** o **privado** (ambos funcionan con Vercel).
   - **No** marques "Add a README" (ya tenemos uno) para evitar conflictos.
   - Clic en **Create repository**.
3. En tu computadora, abre una terminal dentro de la carpeta `landing/` y ejecuta:

```bash
cd landing
git init
git add .
git commit -m "Primera versión de la landing page"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/landing-asesoria-inmobiliaria.git
git push -u origin main
```

Reemplaza `TU-USUARIO` y el nombre del repo por los tuyos reales (aparecen en la página del repositorio recién creado, en el botón verde **Code**).

> Si te pide usuario/contraseña y falla: GitHub ya no acepta contraseñas normales para git push. Necesitas crear un **Personal Access Token** en GitHub → Settings → Developer settings → Personal access tokens, y usarlo como contraseña. Alternativa más simple: usa [GitHub Desktop](https://desktop.github.com/), que maneja el login por ti con una interfaz visual.

---

## Paso 2 — Desplegar en Vercel

1. Ve a [vercel.com](https://vercel.com) y crea una cuenta (puedes usar "Continue with GitHub" para vincular automáticamente).
2. En el dashboard de Vercel, clic en **Add New... → Project**.
3. Selecciona el repositorio `landing-asesoria-inmobiliaria` que acabas de subir (si no aparece, clic en "Adjust GitHub App Permissions" y dale acceso).
4. Vercel detecta automáticamente que es un sitio estático (HTML plano). Configuración recomendada:
   - **Framework Preset**: `Other`
   - **Build Command**: dejar vacío
   - **Output Directory**: dejar vacío (raíz)
5. Clic en **Deploy**. En menos de un minuto tu sitio estará publicado en una URL tipo:
   `https://landing-asesoria-inmobiliaria.vercel.app`

---

## Paso 3 — Conectar tu dominio propio en Vercel

1. Dentro del proyecto ya desplegado, ve a la pestaña **Settings → Domains**.
2. Escribe tu dominio (ej. `tuasesoria.com` o `www.tuasesoria.com`) y clic en **Add**.
3. Vercel te mostrará los registros DNS que debes configurar. Normalmente son dos opciones:
   - **Si el dominio raíz** (`tuasesoria.com`): agrega un registro tipo **A** apuntando a `76.76.21.21`.
   - **Si usas subdominio `www`**: agrega un registro tipo **CNAME** apuntando a `cname.vercel-dns.com`.
4. Ve al panel de administración de donde compraste tu dominio (GoDaddy, Namecheap, Hostinger, etc.), entra a la sección **DNS** y agrega esos registros exactamente como Vercel los indica.
5. Espera la propagación DNS (puede tardar de 5 minutos a unas horas). Vercel mostrará automáticamente un check ✅ verde cuando el dominio quede activo y emitirá el certificado SSL (https) gratis.

---

## Paso 4 — Actualizaciones futuras

Cada vez que quieras hacer un cambio (texto, imágenes, colores):

1. Edita los archivos localmente.
2. Ejecuta:
   ```bash
   git add .
   git commit -m "Describe aquí tu cambio"
   git push
   ```
3. Vercel detecta el push automáticamente y vuelve a desplegar el sitio en segundos — no necesitas hacer nada más.

---

## Personalización rápida de estilos

Todos los colores y tipografías están centralizados en `css/styles.css`, en la sección `:root` al inicio del archivo:

```css
:root{
  --navy:  #0B1F3B;
  --gold:  #C9A24A;
  --white: #FFFFFF;
  --gray:  #F4F4F4;
  ...
}
```

Cambia esos valores para ajustar la paleta en todo el sitio de una sola vez.
