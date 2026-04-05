# Meta Ads Dashboard

Dashboard visual para analizar campañas de Meta Ads con conexión directa a la Meta Graph API. Incluye gráficas temporales, diagnóstico automático de rendimiento, comparativa de periodos y una auditoría rápida con recomendaciones priorizadas.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)
![React](https://img.shields.io/badge/react-18-61dafb.svg)
![TypeScript](https://img.shields.io/badge/typescript-5-3178c6.svg)

## Funcionalidades

- **Tabla interactiva** con campañas, conjuntos de anuncios y anuncios. Ordenamiento, búsqueda, filtros jerárquicos, exportación a CSV e indicadores de salud por fila.
- **Panel lateral de detalle** con KPIs, gráfica temporal interactiva, selector de métricas, comparación dual y diagnóstico con recomendaciones accionables.
- **KPI cards con tendencias**: 8 métricas principales con sparklines y comparativa porcentual vs periodo anterior o año anterior.
- **Comparativa de periodos** configurable: periodo anterior, año anterior o sin comparativa.
- **Barra de salud general** y **panel de auditoría** con recomendaciones priorizadas por severidad.
- **Tema oscuro**, modo de datos sensibles (blur) y skeleton loading.

## Stack técnico

| Componente | Tecnología |
|---|---|
| Frontend | React 18, TypeScript, Vite 6 |
| UI | Tailwind CSS 3, shadcn/ui (Radix UI), Lucide icons |
| Gráficas | Recharts |
| Backend | Express (proxy a la Meta Graph API) |
| API | Meta Marketing API v21.0 |

## Estructura del proyecto

```
.
├── dashboard/           Aplicación completa (frontend + backend)
│   ├── src/             Código React + TypeScript
│   ├── server/          Servidor Express y cliente de la Meta API
│   ├── .env.example     Plantilla de variables de entorno
│   └── package.json
├── scripts/             Utilidades de configuración
│   ├── setup.sh         Setup interactivo (Linux/Mac)
│   ├── setup.ps1        Setup interactivo (Windows PowerShell)
│   ├── refresh-token.sh Renovar el token (Linux/Mac)
│   └── refresh-token.ps1 Renovar el token (Windows PowerShell)
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

## Requisitos

- [Node.js](https://nodejs.org/) 18 o superior
- Una **Meta App** con acceso a la Marketing API ([crear una aquí](https://developers.facebook.com/apps/))
- Un **long-lived access token** con los permisos `ads_read`, `ads_management` y `business_management`

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/soyalvaropareja/dashboard-meta-ads.git
cd dashboard-meta-ads
```

### 2. Obtener las credenciales de Meta

1. Abre el [Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. Selecciona tu app en el desplegable de la derecha.
3. Añade los permisos `ads_read`, `ads_management` y `business_management`.
4. Genera un token de acceso.
5. (Recomendado) Intercámbialo por un long-lived token de ~60 días usando el script incluido (ver paso 3).
6. Copia tu **App Secret** desde el dashboard de tu app (`App Dashboard → Settings → Basic`).

### 3. Configurar variables de entorno

**Opción A — Setup interactivo (recomendado):**

```bash
# Linux / Mac
bash scripts/setup.sh

# Windows (PowerShell)
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
```

El script te pedirá el access token, app secret y app id, los guardará en `dashboard/.env` y hará una prueba de conexión contra la Meta Graph API.

**Opción B — Manual:**

```bash
cp dashboard/.env.example dashboard/.env
# Edita dashboard/.env con tus credenciales reales
```

### 4. Instalar dependencias e iniciar

```bash
cd dashboard
npm install
npm run dev
```

Esto arranca el backend Express en el puerto **3001** y el frontend Vite en el puerto **5173**. Abre `http://localhost:5173` en el navegador.

## Uso

1. Selecciona una cuenta publicitaria en el desplegable del header.
2. Elige el rango de fechas y el modo de comparativa.
3. Navega entre las pestañas: Campañas, Conjuntos de anuncios, Anuncios.
4. Haz click en cualquier fila para abrir el panel lateral con gráficas y diagnóstico.
5. Usa los filtros para analizar subconjuntos (por ejemplo, todos los ads de una campaña concreta).
6. Exporta los datos visibles a CSV con el botón de exportar.

## Renovar el token

Los long-lived tokens de Meta expiran aproximadamente cada **60 días**. Para renovarlo sin tener que volver al Graph API Explorer:

```bash
# Linux / Mac
bash scripts/refresh-token.sh

# Windows (PowerShell)
powershell -ExecutionPolicy Bypass -File scripts\refresh-token.ps1
```

El script intercambia tu token actual por uno nuevo y actualiza `dashboard/.env` automáticamente. Requiere que `META_APP_ID`, `META_APP_SECRET` y `META_ACCESS_TOKEN` estén definidos.

Si tu token ya ha expirado, genera uno nuevo desde el [Graph API Explorer](https://developers.facebook.com/tools/explorer/) y ejecuta el script de setup de nuevo.

## Endpoints de la API

El backend Express expone los siguientes endpoints (todos proxy de la Meta Graph API):

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/accounts` | Lista de cuentas publicitarias |
| `GET` | `/api/accounts/:id/insights/comparison` | Métricas de cuenta con comparativa de periodo |
| `GET` | `/api/accounts/:id/insights/timeseries` | Series temporales a nivel cuenta |
| `GET` | `/api/accounts/:id/campaigns` | Insights de campañas |
| `GET` | `/api/accounts/:id/adsets` | Insights de conjuntos de anuncios |
| `GET` | `/api/accounts/:id/ads` | Insights de anuncios |
| `GET` | `/api/accounts/:id/:level/:entityId/timeseries` | Series temporales diarias para una entidad concreta |

## Contribuir

¿Encontraste un bug o tienes una idea? Abre un issue o envía un pull request. Consulta [CONTRIBUTING.md](CONTRIBUTING.md) para más detalles.

## Licencia

MIT — ver [LICENSE](LICENSE).
