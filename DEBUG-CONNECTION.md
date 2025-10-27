# Guía de Debugging de Conexiones

## ⚠️ PROBLEMA COMÚN: CORS Error

Si ves este error:
```
Access to fetch at 'http://10.1.1.252:5000/api/stats' from origin 'http://10.1.1.114:3001' 
has been blocked by CORS policy
```

**Causa**: Estás accediendo desde el puerto **3001** en lugar del **3000**, y el proxy NO se está activando.

**Solución**:
```bash
# Opción 1: Usar el script de reinicio
./restart-dev.sh

# Opción 2: Manual
# 1. Detener todos los servidores
lsof -ti:3000,3001 | xargs kill -9

# 2. Iniciar en el puerto correcto
npm run dev

# 3. Acceder a: http://localhost:3000 (NO 3001)
```

**Verificar que el proxy está activo**: En los logs deberías ver:
```
[STATUS] Casa Frigate: Using proxy: true  ✅
```

Si ves `Using proxy: false` ❌, el proxy NO está funcionando.

## Cambios Implementados

### ✅ Código Simplificado
- Eliminado servidor `cctv_dolan` innecesario
- Eliminada configuración MQTT del modal (no necesaria para conexión básica)
- Proxy simplificado a solo 2 rutas: `/proxy/casa` y `/proxy/casa_auth`

### ✅ Logging Detallado Agregado
Ahora cada petición muestra logs completos en la consola:

#### En el Proxy (Terminal donde corre `npm run dev`):
```
[PROXY casa] GET /proxy/casa/api/stats -> /api/stats
[PROXY casa] Response: 200 for /proxy/casa/api/stats
```

#### En el Browser (DevTools Console):
```
[STATUS] Fetching status for Casa Frigate (Direct) (casa)
[STATUS] Casa Frigate (Direct): Fetching /proxy/casa/api/stats
[STATUS] Casa Frigate (Direct): Using proxy: true
[STATUS] Casa Frigate (Direct): Auth type: none
[STATUS] Casa Frigate (Direct): Response 200 in 45ms
[STATUS] Casa Frigate (Direct): Successfully parsed stats
```

#### Para servidores con Auth Frigate:
```
[STATUS] Fetching status for Casa Frigate (Auth) (casa_auth)
[STATUS] Casa Frigate (Auth): Attempting Frigate login...
[LOGIN] Casa Frigate (Auth): Attempting login to /proxy/casa_auth/api/login
[LOGIN] Casa Frigate (Auth): Username: juan
[PROXY casa_auth] POST /proxy/casa_auth/api/login -> /api/login
[PROXY casa_auth] Response: 200 for /proxy/casa_auth/api/login
[PROXY casa_auth] Setting cookies: [...]
[LOGIN] Casa Frigate (Auth): Response status: 200 OK
[LOGIN] Casa Frigate (Auth): Login SUCCESS
[LOGIN] Casa Frigate (Auth): Cookies after login: frigate_token=...
[STATUS] Casa Frigate (Auth): Login SUCCESS
[STATUS] Casa Frigate (Auth): Fetching /proxy/casa_auth/api/stats
[STATUS] Casa Frigate (Auth): Using proxy: true
[STATUS] Casa Frigate (Auth): Auth type: frigate
[STATUS] Casa Frigate (Auth): Including credentials for cookies
[PROXY casa_auth] GET /proxy/casa_auth/api/stats -> /api/stats
[PROXY casa_auth] Forwarding cookies
[PROXY casa_auth] Response: 200 for /proxy/casa_auth/api/stats
[STATUS] Casa Frigate (Auth): Response 200 in 67ms
[STATUS] Casa Frigate (Auth): Successfully parsed stats
```

### ✅ Botón de Test de Conexión
- Icono de refresh en cada fila de servidor
- Animación de spin mientras testea
- Logs detallados en consola con separadores visuales:
```
========== TESTING CONNECTION: Casa Frigate (Direct) ==========
[STATUS] Fetching status for Casa Frigate (Direct) (casa)
...
========== TEST COMPLETE: Casa Frigate (Direct) - ONLINE ==========
```

## Cómo Usar el Debugging

### 1. Iniciar el servidor con logs visibles
```bash
npm run dev
```
Mantén esta terminal visible para ver los logs del proxy.

### 2. Abrir DevTools en el navegador
- Presiona F12
- Ve a la pestaña "Console"
- Opcional: Filtra por `[STATUS]`, `[LOGIN]` o `[PROXY]`

### 3. Ir a la página de Configuración
```
http://localhost:3000/config
```

### 4. Hacer click en el botón de Test (icono de refresh)
Verás logs detallados en ambas consolas (terminal y browser).

## Diagnóstico de Problemas Comunes

### Problema: "Network error - cannot reach server"
**Causa**: El servidor no está accesible desde la red.

**Solución**:
```bash
# Verificar conectividad
ping 10.1.1.252

# Verificar puertos
nc -zv 10.1.1.252 5000
nc -zv 10.1.1.252 8971

# Probar directamente con curl
curl -v http://10.1.1.252:5000/api/version
```

### Problema: "Request timed out after 5 seconds"
**Causa**: El servidor responde muy lento o hay problemas de red.

**Logs esperados**:
```
[STATUS] Casa Frigate: FAILED after 5001ms
[STATUS] Casa Frigate: Error type: AbortError
[STATUS] Casa Frigate: Request timed out after 5 seconds
```

**Solución**:
- Verificar que el servidor Frigate está corriendo
- Revisar carga del servidor
- Aumentar timeout en `serverStatus.ts` línea 63 si es necesario

### Problema: Login falla (401 Unauthorized)
**Causa**: Credenciales incorrectas.

**Logs esperados**:
```
[LOGIN] Casa Frigate (Auth): Response status: 401 Unauthorized
[LOGIN] Casa Frigate (Auth): Login FAILED - 401 Unauthorized
[LOGIN] Casa Frigate (Auth): Response body: {"error":"Invalid credentials"}
```

**Solución**:
1. Verificar usuario y password en la configuración del servidor
2. Probar login con curl:
```bash
curl -vk -c /tmp/frigate.cookies \
  -H "Content-Type: application/json" \
  -d '{"user":"juan","password":"daytona1309"}' \
  "https://10.1.1.252:8971/api/login"
```

### Problema: Cookies no se guardan
**Causa**: Configuración de SameSite o Secure en las cookies.

**Logs esperados**:
```
[LOGIN] Casa Frigate (Auth): Login SUCCESS
[LOGIN] Casa Frigate (Auth): Cookies after login: none
```

**Solución**:
- El proxy ya está configurado con `secure: false`
- Verificar que el servidor Frigate no está enviando cookies con `SameSite=Strict`
- Revisar en DevTools → Application → Cookies

### Problema: Proxy error ECONNREFUSED
**Causa**: El proxy no puede conectar al servidor target.

**Logs esperados (en terminal)**:
```
[PROXY casa] ERROR: connect ECONNREFUSED 10.1.1.252:5000
```

**Solución**:
1. Verificar que la IP y puerto son correctos en `vite.config.ts`
2. Verificar firewall del servidor
3. Verificar que el servicio está corriendo:
```bash
# En el servidor Frigate
systemctl status frigate
# o
docker ps | grep frigate
```

## Configuración Actual

### Servidores Configurados:
1. **Casa Frigate (Direct)** - `id: casa`
   - URL: `http://10.1.1.252:5000`
   - Auth: none
   - Estado: Habilitado
   - Proxy: `/proxy/casa` → `http://10.1.1.252:5000`

2. **Casa Frigate (Auth)** - `id: casa_auth`
   - URL: `https://10.1.1.252:8971`
   - Auth: frigate (juan/daytona1309)
   - Estado: Deshabilitado por defecto
   - Proxy: `/proxy/casa_auth` → `https://10.1.1.252:8971`

### Para Habilitar el Servidor con Auth:
1. Ir a Configuración
2. Click en Edit (icono lápiz) en "Casa Frigate (Auth)"
3. Marcar checkbox "Enabled"
4. Guardar
5. Click en Test (icono refresh)
6. Revisar logs en consola

## Próximos Pasos

Si después de revisar los logs el problema persiste:

1. **Capturar logs completos**: Copia todos los logs de la consola y terminal
2. **Verificar red**: Asegúrate de que puedes hacer ping y curl al servidor
3. **Revisar Frigate**: Verifica que Frigate está corriendo y respondiendo
4. **Probar endpoints**: Usa los comandos curl del README para probar directamente

## Comandos de Test Rápido

```bash
# Test servidor directo (puerto 5000)
curl -v http://10.1.1.252:5000/api/version
curl -v http://10.1.1.252:5000/api/stats

# Test servidor con auth (puerto 8971)
# 1. Login
curl -vk -c /tmp/frigate.cookies \
  -H "Content-Type: application/json" \
  -d '{"user":"juan","password":"daytona1309"}' \
  "https://10.1.1.252:8971/api/login"

# 2. Stats con cookie
curl -sk -b /tmp/frigate.cookies \
  "https://10.1.1.252:8971/api/stats"

# 3. Version con cookie
curl -sk -b /tmp/frigate.cookies \
  "https://10.1.1.252:8971/api/version"
```
