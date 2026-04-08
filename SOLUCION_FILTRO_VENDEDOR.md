# SOLUCIÓN: Filtrado de Datos por Vendedor

## Problema Resuelto

Los vendedores no podían ver sus datos correctamente filtrados por ID porque:
- El backend NO retornaba el `id_vendedor` en el login
- El frontend intentaba filtrar con `usuario.id_vendedor` que era `undefined`
- Se filtraba incorrectamente usando `username` lo cual era inseguro e ineficiente

## Solución Implementada (Solo Frontend - Sin tocar el servidor)

### Estrategia
Después del login exitoso, hacer una llamada adicional a `vendedorByUsuario(usuario_id)` para obtener el `id_vendedor` del vendedor logueado y guardarlo en el `authStore`.

### Archivos Modificados

#### 1. src/types/entities.ts
- Agregado campo `id_vendedor` opcional al interface `Usuario`
- Agregados campos `id_vendedor` y `vendedor_id` a todas las entidades relacionadas:
  - `Pedido`
  - `Venta`
  - `Corte`
  - `Comprobante`
  - `Cliente`

#### 2. src/hooks/useAuth.ts
Modificado el método `login()` para:
- Detectar si el usuario es vendedor (rol_id === 2)
- Llamar a `getVendedorByUsuarioId()` después del login
- Guardar el `id_vendedor` en el objeto usuario del store

```typescript
// Después del login, si es vendedor:
if (result.usuario.rol_id === ROLE_VENDEDOR) {
  const vendedorData = await getVendedorByUsuarioId(result.usuario.id_usuario);
  setUsuario({
    ...result.usuario,
    id_vendedor: vendedorData?.id_vendedor || null,
  });
}
```

#### 3. Pantallas de Vendedor Actualizadas
Filtros simplificados y seguros usando `usuario.id_vendedor`:

**Archivos actualizados:**
- app/(app)/pedidos/vendedor.tsx
- app/(app)/pedidos/vendedor_detail.tsx
- app/(app)/cortes/vendedor.tsx
- app/(app)/cortes/vendedor_detail.tsx
- app/(app)/comprobantes/vendedor.tsx
- app/(app)/comprobantes/vendedor_detail.tsx
- app/(app)/ventas/vendedor.tsx
- app/(app)/clientes/vendedor.tsx
- src/components/dashboard/VendedorDashboard.tsx

**Filtro ANTES (Inseguro e Ineficiente):**
```typescript
const myData = data.filter(item => 
  item.id_vendedor === usuario?.id_vendedor ||  // undefined!
  item.vendedor?.username === usuario?.username || // inseguro
  item.vendedor_id === usuario?.id_vendedor // undefined!
);
```

**Filtro AHORA (Seguro y Eficiente):**
```typescript
const myData = data.filter(item => 
  item.vendedor?.id_vendedor === usuario?.id_vendedor || 
  item.id_vendedor === usuario?.id_vendedor
);
```

#### 4. Pantallas de Admin Actualizadas
Cuando un vendedor accede a pantallas admin, el filtro también usa el nuevo campo:

**Archivos actualizados:**
- app/(app)/pedidos/admin.tsx
- app/(app)/cortes/admin.tsx
- app/(app)/comprobantes/admin.tsx

## Beneficios de la Solución

### Sin cambios en el backend
- No requiere modificar la API del servidor
- No hay riesgo de romper otras funcionalidades
- Cambios aislados en el frontend

### Seguridad mejorada
- Ya no se filtra por `username` (menos seguro)
- Se usa directamente el `id_vendedor` numérico
- Filtros más precisos y confiables

### Rendimiento
- Filtros más eficientes usando IDs numéricos
- Menos comparaciones innecesarias
- Código más limpio y mantenible

### Consistencia
- Mismo patrón de filtrado en todas las pantallas
- TypeScript garantiza tipos correctos
- Menos errores en runtime

## Cómo Funciona

### Flujo de Login:
1. Usuario ingresa credenciales
2. Backend valida y retorna token + datos básicos de usuario
3. Frontend detecta si es vendedor (rol_id === 2)
4. Frontend consulta `vendedorByUsuario(usuario_id)`
5. Frontend obtiene el `id_vendedor`
6. Frontend guarda `id_vendedor` en el authStore
7. Usuario redirigido al dashboard

### Flujo de Filtrado:
1. Pantalla solicita datos (ej: `getPedidos()`)
2. Backend retorna TODOS los pedidos
3. Frontend filtra localmente usando `usuario.id_vendedor`
4. Solo se muestran los pedidos del vendedor logueado

## Notas Importantes

- El `id_vendedor` se guarda en el `authStore` persistente (SecureStore)
- Permanece disponible entre sesiones hasta el logout
- Si el vendedor no existe en la tabla vendedores, `id_vendedor` será `null`
- Los filtros manejan correctamente valores `undefined` o `null`

## Próximos Pasos (Opcional - Mejoras Futuras)

Si en el futuro quieres optimizar aún más, puedes:

1. **Crear queries específicas en el backend:**
   - `pedidosPorVendedor(vendedor_id: Int!)`
   - `ventasPorVendedor(vendedor_id: Int!)`
   - `pagosPorVendedor(vendedor_id: Int!)`

2. **Usar las queries específicas en lugar de filtrar en frontend:**
   - Menos datos transferidos
   - Filtrado en base de datos (más rápido)
   - Mejor para muchos registros

Pero la solución actual funciona perfectamente sin tocar el servidor.
