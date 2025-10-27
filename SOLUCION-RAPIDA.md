# 🔧 Solución Rápida - Error CORS

## El Problema

Estás viendo este error:
```
Access to fetch at 'http://10.1.1.252:5000/api/stats' from origin 'http://10.1.1.114:3001' 
has been blocked by CORS policy
```

Y en los logs:
```
[STATUS] Casa Frigate: Using proxy: false ❌
```

## La Causa

Estás accediendo desde el **puerto 3001** en lugar del **3000**. El proxy de Vite solo funciona en el puerto configurado (3000).

## La Solución (3 pasos)

### 1️⃣ Detener el servidor actual

```bash
cd /root/ExaVMS
./restart-dev.sh
```

O manualmente:
```bash
lsof -ti:3000,3001 | xargs kill -9
npm run dev
```

### 2️⃣ Acceder a la URL correcta

❌ **NO uses**: `http://10.1.1.114:3001`  
✅ **USA**: `http://localhost:3000` o `http://10.1.1.114:3000`

### 3️⃣ Verificar que funciona

Abre DevTools (F12) y deberías ver:
```
[STATUS] Casa Frigate: Using proxy: true ✅
[PROXY casa] GET /proxy/casa/api/stats -> /api/stats
[PROXY casa] Response: 200 for /proxy/casa/api/stats
[STATUS] Casa Frigate: Response 200 in 45ms
[STATUS] Casa Frigate: Successfully parsed stats
```

## ¿Por qué pasa esto?

El proxy de Vite está configurado en `vite.config.ts` para correr en el puerto 3000:

```typescript
server: {
  port: 3000,  // ← Puerto configurado
  proxy: {
    '/proxy/casa': {
      target: 'http://10.1.1.252:5000',
      // ...
    }
  }
}
```

Cuando accedes desde el puerto 3001:
- El navegador intenta conectar **directamente** a `http://10.1.1.252:5000`
- El servidor Frigate no tiene CORS habilitado
- El navegador bloquea la petición

Cuando accedes desde el puerto 3000:
- El navegador conecta a `/proxy/casa/api/stats`
- Vite proxy reenvía la petición a `http://10.1.1.252:5000/api/stats`
- No hay problema de CORS porque es la misma origin

## Comandos Útiles

```bash
# Ver qué puertos están en uso
lsof -i:3000
lsof -i:3001

# Matar procesos en esos puertos
lsof -ti:3000,3001 | xargs kill -9

# Iniciar servidor
npm run dev

# Ver logs del servidor
# (mantén la terminal visible para ver logs del proxy)
```

## Checklist de Verificación

- [ ] Servidor corriendo en puerto 3000
- [ ] Accediendo a `http://localhost:3000` (no 3001)
- [ ] En DevTools Console: `[STATUS] ... Using proxy: true`
- [ ] En Terminal: `[PROXY casa] GET /proxy/casa/api/stats`
- [ ] Servidor muestra estado "online" con métricas

## Si Sigue Sin Funcionar

1. **Verifica que Frigate está corriendo**:
   ```bash
   curl http://10.1.1.252:5000/api/version
   ```

2. **Verifica conectividad**:
   ```bash
   ping 10.1.1.252
   nc -zv 10.1.1.252 5000
   ```

3. **Revisa los logs completos** en DevTools y Terminal

4. **Prueba el botón de Test** (🔄) en la página de configuración
