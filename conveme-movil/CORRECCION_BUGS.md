# CORRECCIÓN DE BUGS - Filtros de Vendedor

## Problemas Encontrados y Corregidos

### 1. Pantalla de Detalle de Venta se quedaba cargando infinitamente

**Archivo:** `app/(app)/ventas/vendedor_detail.tsx` (línea 59)

**Problema:** El filtro usaba `usuario.id_vendedor` que era `undefined` porque no se había implementado la solución completa del login.

**Antes:**
```typescript
const venta = ventas.find((v) => 
  v.id_venta === ventaId && (
    v.id_vendedor === usuario?.id_vendedor ||  // undefined!
    v.vendedor?.username === usuario?.username || // inseguro
    v.vendedor_id === usuario?.id_vendedor // undefined!
  )
);
```

**Después:**
```typescript
const venta = ventas.find((v) => 
  v.id_venta === ventaId && (
    v.vendedor?.id_vendedor === usuario?.id_vendedor || 
    v.id_vendedor === usuario?.id_vendedor
  )
);
```

**Resultado:** Ahora encuentra la venta correctamente y muestra el detalle.

---

### 2. Los vendedores NO podían crear pedidos

**Archivo:** `app/(app)/pedidos/create.tsx` (líneas 172 y 211)

**Problema:** La auto-selección del vendedor y el filtro de vendedores usaban `username` en lugar de `id_vendedor`.

**Cambio 1 - Auto-selección (línea 172):**
```typescript
// ANTES
const yo = vendedoresData.find((v: any) => 
  v.id_vendedor === usuario.id_vendedor || 
  v.username === usuario.username  // Nunca encontraba al vendedor
);

// DESPUÉS
const yo = vendedoresData.find((v: any) => 
  v.id_vendedor === usuario.id_vendedor
);
```

**Cambio 2 - Filtro de vendedores (línea 211):**
```typescript
// ANTES
if (!isAdmin) {
  list = vendedores.filter(v => 
    v.id_vendedor === usuario?.id_vendedor || 
    v.username === usuario?.username  // Campo que no existe en Vendedor
  );
}

// DESPUÉS
if (!isAdmin) {
  list = vendedores.filter(v => 
    v.id_vendedor === usuario?.id_vendedor
  );
}
```

**Resultado:** Ahora el vendedor se auto-selecciona correctamente y puede crear pedidos.

---

### 3. Mismo problema en creación de ventas

**Archivos corregidos:**
- `app/(app)/ventas/create.tsx` (líneas 188 y 373)
- `app/(app)/ventas/admin.tsx` (líneas 75, 99, 100)

**Problema:** Mismo patrón de usar `username` en lugar de `id_vendedor`.

**Solución:** Reemplazados todos los filtros con el patrón correcto:
```typescript
v.vendedor?.id_vendedor === usuario?.id_vendedor || 
v.id_vendedor === usuario?.id_vendedor
```

---

## Resumen de Archivos Modificados

1. `app/(app)/ventas/vendedor_detail.tsx` - Detalle de venta
2. `app/(app)/pedidos/create.tsx` - Crear/editar pedidos
3. `app/(app)/ventas/create.tsx` - Crear/editar ventas
4. `app/(app)/ventas/admin.tsx` - Vista admin de ventas

## Causa Raíz del Problema

El problema surgió porque los filtros intentaban usar `usuario.id_vendedor` ANTES de que se implementara la solución del login que obtiene ese campo. Algunos archivos también usaban `v.username` que NO existe en la entidad Vendedor (solo existe en Usuario).

## Verificación

Ejecutar:
```bash
grep -r "\.username === usuario" app/ src/ | wc -l
```

Resultado esperado: `0` (excepto usos legítimos como en login o info de empleados)

---

## Pruebas Recomendadas

1. Login como vendedor
2. Verificar que el dashboard carga correctamente
3. Intentar crear un pedido (debería auto-seleccionar al vendedor)
4. Intentar crear una venta (debería auto-seleccionar al vendedor)
5. Ver el detalle de una venta existente (no debería quedarse cargando)
6. Verificar que solo ve sus propios datos (pedidos, ventas, cortes, etc.)
