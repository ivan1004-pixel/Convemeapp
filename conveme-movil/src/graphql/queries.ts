// ─── Auth ─────────────────────────────────────────────────────────────────────

export const LOGIN_MUTATION = `
  mutation Login($username: String!, $password_raw: String!) {
    login(loginInput: { username: $username, password_raw: $password_raw }) {
      token
      usuario { id_usuario rol_id username }
    }
  }
`;

// ─── Usuarios ─────────────────────────────────────────────────────────────────

export const GET_USUARIO = `
  query GetPerfil($id: Int!) {
    usuario(id_usuario: $id) {
      id_usuario
      username
      rol_id
      activo
      created_at
    }
  }
`;

export const GET_USUARIOS = `
  query {
    usuarios { id_usuario username }
  }
`;

export const CREATE_USUARIO = `
  mutation CreateUsuario($username: String!, $password_raw: String!, $rol_id: Int!) {
    createUsuario(createUsuarioInput: {
      username: $username
      password_raw: $password_raw
      rol_id: $rol_id
    }) {
      id_usuario
      username
    }
  }
`;

export const UPDATE_USUARIO = `
  mutation UpdateUsuario($updateUsuarioInput: UpdateUsuarioInput!) {
    updateUsuario(updateUsuarioInput: $updateUsuarioInput) {
      id_usuario
      username
      rol_id
      activo
    }
  }
`;

// ─── Categorías ───────────────────────────────────────────────────────────────

export const GET_CATEGORIAS = `
  query { categorias { id_categoria nombre } }
`;

export const CREATE_CATEGORIA = `
  mutation CreateCategoria($input: CreateCategoriaInput!) {
    createCategoria(createCategoriaInput: $input) { id_categoria nombre }
  }
`;

export const UPDATE_CATEGORIA = `
  mutation UpdateCategoria($input: UpdateCategoriaInput!) {
    updateCategoria(updateCategoriaInput: $input) { id_categoria nombre }
  }
`;

export const DELETE_CATEGORIA = `
  mutation RemoveCategoria($id: Int!) {
    removeCategoria(id_categoria: $id) { id_categoria }
  }
`;

// ─── Tamaños ──────────────────────────────────────────────────────────────────

export const GET_TAMANOS = `
  query { tamanos { id_tamano descripcion } }
`;

export const CREATE_TAMANO = `
  mutation CreateTamano($input: CreateTamanoInput!) {
    createTamano(createTamanoInput: $input) { id_tamano descripcion }
  }
`;

export const UPDATE_TAMANO = `
  mutation UpdateTamano($input: UpdateTamanoInput!) {
    updateTamano(updateTamanoInput: $input) { id_tamano descripcion }
  }
`;

export const DELETE_TAMANO = `
  mutation RemoveTamano($id: Int!) {
    removeTamano(id_tamano: $id) { id_tamano }
  }
`;

// ─── Productos ────────────────────────────────────────────────────────────────

export const GET_PRODUCTOS = `
  query {
    productos {
      id_producto
      sku
      nombre
      precio_unitario
      precio_mayoreo
      cantidad_minima_mayoreo
      costo_produccion
      categoria { id_categoria nombre }
      tamano { id_tamano descripcion }
    }
  }
`;

export const CREATE_PRODUCTO = `
  mutation CreateProducto($input: CreateProductoInput!) {
    createProducto(createProductoInput: $input) { id_producto nombre sku }
  }
`;

export const UPDATE_PRODUCTO = `
  mutation UpdateProducto($input: UpdateProductoInput!) {
    updateProducto(updateProductoInput: $input) { id_producto nombre sku }
  }
`;

export const DELETE_PRODUCTO = `
  mutation RemoveProducto($id: Int!) {
    removeProducto(id_producto: $id) { id_producto }
  }
`;

// ─── Clientes ─────────────────────────────────────────────────────────────────

export const GET_CLIENTES = `
  query {
    clientes {
      id_cliente
      nombre_completo
      email
      telefono
      direccion_envio
      fecha_registro
      usuario { id_usuario username }
    }
  }
`;

export const CREATE_CLIENTE = `
  mutation CreateCliente($input: CreateClienteInput!) {
    createCliente(createClienteInput: $input) { id_cliente nombre_completo }
  }
`;

export const UPDATE_CLIENTE = `
  mutation UpdateCliente($input: UpdateClienteInput!) {
    updateCliente(updateClienteInput: $input) { id_cliente nombre_completo }
  }
`;

export const DELETE_CLIENTE = `
  mutation RemoveCliente($id_cliente: Int!) {
    removeCliente(id_cliente: $id_cliente)
  }
`;

// ─── Ubicación ────────────────────────────────────────────────────────────────

export const GET_ESTADOS = `
  query { estados { id_estado nombre } }
`;

export const GET_MUNICIPIOS_POR_ESTADO = `
  query GetMunicipios($estado_id: Int!) {
    municipiosPorEstado(estado_id: $estado_id) { id_municipio nombre }
  }
`;

// ─── Escuelas ─────────────────────────────────────────────────────────────────

export const GET_ESCUELAS = `
  query {
    escuelas {
      id_escuela
      nombre
      siglas
      activa
      municipio {
        id_municipio
        nombre
        estado { id_estado nombre }
      }
    }
  }
`;

export const CREATE_ESCUELA = `
  mutation CreateEscuela($input: CreateEscuelaInput!) {
    createEscuela(createEscuelaInput: $input) { id_escuela nombre }
  }
`;

export const UPDATE_ESCUELA = `
  mutation UpdateEscuela($input: UpdateEscuelaInput!) {
    updateEscuela(updateEscuelaInput: $input) { id_escuela nombre }
  }
`;

export const DELETE_ESCUELA = `
  mutation RemoveEscuela($id: Int!) {
    removeEscuela(id_escuela: $id) { id_escuela }
  }
`;

// ─── Vendedores ───────────────────────────────────────────────────────────────

export const GET_VENDEDORES = `
  query {
    vendedores {
      id_vendedor
      nombre_completo
      email
      telefono
      instagram_handle
      comision_fija_menudeo
      comision_fija_mayoreo
      meta_ventas_mensual
      escuela { id_escuela nombre }
      municipio {
        id_municipio
        nombre
        estado { id_estado nombre }
      }
    }
  }
`;

export const GET_VENDEDOR_BY_USUARIO = `
  query VendedorByUsuario($usuario_id: Int!) {
    vendedorByUsuario(usuario_id: $usuario_id) {
      id_vendedor
      nombre_completo
      email
      telefono
      instagram_handle
      comision_fija_menudeo
      comision_fija_mayoreo
      meta_ventas_mensual
      escuela { nombre }
      municipio { nombre estado { nombre } }
    }
  }
`;

export const CREATE_VENDEDOR = `
  mutation CreateVendedor($input: CreateVendedorInput!) {
    createVendedor(createVendedorInput: $input) { id_vendedor nombre_completo }
  }
`;

export const UPDATE_VENDEDOR = `
  mutation UpdateVendedor($input: UpdateVendedorInput!) {
    updateVendedor(updateVendedorInput: $input) { id_vendedor nombre_completo }
  }
`;

export const DELETE_VENDEDOR = `
  mutation RemoveVendedor($id: Int!) {
    removeVendedor(id_vendedor: $id) { id_vendedor }
  }
`;

// ─── Empleados ────────────────────────────────────────────────────────────────

export const GET_EMPLEADOS = `
  query {
    empleados {
      id_empleado
      nombre_completo
      email
      telefono
      puesto
      calle_y_numero
      colonia
      codigo_postal
      usuario { id_usuario username rol { nombre } }
      municipio {
        id_municipio
        nombre
        estado { id_estado nombre }
      }
    }
  }
`;

export const CREATE_EMPLEADO = `
  mutation CreateEmpleado($input: CreateEmpleadoInput!) {
    createEmpleado(createEmpleadoInput: $input) { id_empleado nombre_completo }
  }
`;

export const UPDATE_EMPLEADO = `
  mutation UpdateEmpleado($input: UpdateEmpleadoInput!) {
    updateEmpleado(updateEmpleadoInput: $input) { id_empleado nombre_completo }
  }
`;

export const DELETE_EMPLEADO = `
  mutation RemoveEmpleado($id: Int!) {
    removeEmpleado(id_empleado: $id) { id_empleado }
  }
`;

// ─── Ventas ───────────────────────────────────────────────────────────────────

export const GET_VENTAS = `
  query {
    ventas {
      id_venta
      fecha_venta
      monto_total
      metodo_pago
      estado
      vendedor { nombre_completo }
      detalles {
        cantidad
        precio_unitario
        producto { nombre sku }
      }
    }
  }
`;

export const CREATE_VENTA = `
  mutation CreateVenta($input: CreateVentaInput!) {
    createVenta(createVentaInput: $input) { id_venta monto_total estado }
  }
`;

export const UPDATE_VENTA = `
  mutation UpdateVenta($input: UpdateVentaInput!) {
    updateVenta(updateVentaInput: $input) { id_venta metodo_pago estado }
  }
`;

export const DELETE_VENTA = `
  mutation RemoveVenta($id: Int!) { removeVenta(id_venta: $id) }
`;

// ─── Pedidos ──────────────────────────────────────────────────────────────────

export const GET_PEDIDOS = `
  query {
    pedidos {
      id_pedido
      fecha_pedido
      fecha_entrega_estimada
      monto_total
      anticipo
      estado
      vendedor { id_vendedor nombre_completo }
      cliente { id_cliente nombre_completo }
      detalles {
        cantidad
        precio_unitario
        producto { id_producto nombre sku }
      }
    }
  }
`;

export const CREATE_PEDIDO = `
  mutation CreatePedido($input: CreatePedidoInput!) {
    createPedido(createPedidoInput: $input) { id_pedido estado monto_total }
  }
`;

export const UPDATE_PEDIDO = `
  mutation UpdatePedido($input: UpdatePedidoInput!) {
    updatePedido(updatePedidoInput: $input) { id_pedido estado }
  }
`;

export const DELETE_PEDIDO = `
  mutation RemovePedido($id: Int!) { removePedido(id_pedido: $id) }
`;

// ─── Eventos ──────────────────────────────────────────────────────────────────

export const GET_EVENTOS = `
  query {
    eventos {
      id_evento
      nombre
      descripcion
      fecha_inicio
      fecha_fin
      costo_stand
      escuela { id_escuela nombre }
      municipio {
        id_municipio
        nombre
        estado { id_estado nombre }
      }
    }
  }
`;

export const CREATE_EVENTO = `
  mutation CreateEvento($input: CreateEventoInput!) {
    createEvento(createEventoInput: $input) { id_evento nombre }
  }
`;

export const UPDATE_EVENTO = `
  mutation UpdateEvento($input: UpdateEventoInput!) {
    updateEvento(updateEventoInput: $input) { id_evento nombre }
  }
`;

export const DELETE_EVENTO = `
  mutation RemoveEvento($id: Int!) {
    removeEvento(id_evento: $id) { id_evento }
  }
`;

// ─── Insumos ──────────────────────────────────────────────────────────────────

export const GET_INSUMOS = `
  query {
    insumos {
      id_insumo
      nombre
      unidad_medida
      stock_actual
      stock_minimo_alerta
    }
  }
`;

export const CREATE_INSUMO = `
  mutation CreateInsumo($input: CreateInsumoInput!) {
    createInsumo(createInsumoInput: $input) { id_insumo nombre }
  }
`;

export const UPDATE_INSUMO = `
  mutation UpdateInsumo($input: UpdateInsumoInput!) {
    updateInsumo(updateInsumoInput: $input) { id_insumo nombre }
  }
`;

export const DELETE_INSUMO = `
  mutation RemoveInsumo($id_insumo: Int!) { removeInsumo(id_insumo: $id_insumo) }
`;

// ─── Promociones ──────────────────────────────────────────────────────────────

export const GET_PROMOCIONES = `
  query {
    promociones {
      id_promocion
      nombre
      descripcion
      tipo_promocion
      valor_descuento
      fecha_inicio
      fecha_fin
      activa
    }
  }
`;

export const CREATE_PROMOCION = `
  mutation CreatePromocion($input: CreatePromocionInput!) {
    createPromocion(createPromocionInput: $input) { id_promocion nombre }
  }
`;

export const UPDATE_PROMOCION = `
  mutation UpdatePromocion($input: UpdatePromocionInput!) {
    updatePromocion(updatePromocionInput: $input) { id_promocion nombre }
  }
`;

export const DELETE_PROMOCION = `
  mutation RemovePromocion($id_promocion: Int!) {
    removePromocion(id_promocion: $id_promocion)
  }
`;

// ─── Comprobantes ─────────────────────────────────────────────────────────────

export const GET_COMPROBANTES = `
  query {
    comprobantes {
      id_comprobante
      total_vendido
      comision_vendedor
      monto_entregado
      saldo_pendiente
      fecha_corte
      notas
      vendedor { id_vendedor nombre_completo }
      admin { id_usuario username }
    }
  }
`;

export const CREATE_COMPROBANTE = `
  mutation CreateComprobante($input: CreateComprobanteInput!) {
    createComprobante(createComprobanteInput: $input) { id_comprobante fecha_corte }
  }
`;

export const UPDATE_COMPROBANTE = `
  mutation UpdateComprobante($input: UpdateComprobanteInput!) {
    updateComprobante(updateComprobanteInput: $input) { id_comprobante saldo_pendiente }
  }
`;

export const DELETE_COMPROBANTE = `
  mutation RemoveComprobante($id: Int!) { removeComprobante(id: $id) }
`;

// ─── Cuentas Bancarias ────────────────────────────────────────────────────────

export const GET_CUENTAS_BANCARIAS = `
  query {
    cuentasBancarias {
      id_cuenta
      banco
      titular_cuenta
      numero_cuenta
      clabe_interbancaria
      vendedor { id_vendedor nombre_completo }
    }
  }
`;

export const CREATE_CUENTA_BANCARIA = `
  mutation CreateCuentaBancaria($input: CreateCuentaBancariaInput!) {
    createCuentaBancaria(createCuentaBancariaInput: $input) { id_cuenta banco }
  }
`;

export const UPDATE_CUENTA_BANCARIA = `
  mutation UpdateCuentaBancaria($input: UpdateCuentaBancariaInput!) {
    updateCuentaBancaria(updateCuentaBancariaInput: $input) { id_cuenta banco }
  }
`;

export const DELETE_CUENTA_BANCARIA = `
  mutation RemoveCuentaBancaria($id: Int!) {
    removeCuentaBancaria(id_cuenta: $id) { id_cuenta }
  }
`;

// ─── Asignaciones ─────────────────────────────────────────────────────────────

export const GET_ASIGNACIONES = `
  query GetAsignaciones($search: String) {
    asignacionesVendedor(search: $search) {
      id_asignacion
      fecha_asignacion
      estado
      vendedor { id_vendedor nombre_completo }
      detalles {
        id_det_asignacion
        cantidad_asignada
        producto { id_producto nombre sku precio_unitario }
      }
    }
  }
`;

export const CREATE_ASIGNACION = `
  mutation CreateAsignacionVendedor($input: CreateAsignacionVendedorInput!) {
    createAsignacionVendedor(createAsignacionVendedorInput: $input) {
      id_asignacion
      estado
    }
  }
`;

export const UPDATE_ASIGNACION = `
  mutation UpdateAsignacionVendedor($input: UpdateAsignacionVendedorInput!) {
    updateAsignacionVendedor(updateAsignacionVendedorInput: $input) {
      id_asignacion
      estado
    }
  }
`;

export const DELETE_ASIGNACION = `
  mutation RemoveAsignacionVendedor($id: Int!) {
    removeAsignacionVendedor(id_asignacion: $id)
  }
`;

// ─── Cortes ───────────────────────────────────────────────────────────────────

export const GET_CORTES = `
  query GetCortesVendedor($search: String) {
    cortesVendedor(search: $search) {
      id_corte
      fecha_corte
      dinero_esperado
      dinero_total_entregado
      diferencia_corte
      observaciones
      vendedor { id_vendedor nombre_completo }
      asignacion { id_asignacion }
      detalles {
        id_det_corte
        cantidad_vendida
        cantidad_devuelta
        merma_reportada
        producto { id_producto nombre precio_unitario }
      }
    }
  }
`;

export const GET_CORTES_POR_VENDEDOR = `
  query GetCortesPorVendedor($vendedor_id: Int!) {
    cortesPorVendedor(vendedor_id: $vendedor_id) {
      id_corte
      fecha_corte
      dinero_esperado
      dinero_total_entregado
      diferencia_corte
      observaciones
      vendedor { id_vendedor nombre_completo }
      asignacion { id_asignacion }
      detalles {
        id_det_corte
        cantidad_vendida
        cantidad_devuelta
        merma_reportada
        producto { id_producto nombre precio_unitario }
      }
    }
  }
`;

export const CREATE_CORTE = `
  mutation CreateCorteVendedor($input: CreateCorteVendedorInput!) {
    createCorteVendedor(createCorteVendedorInput: $input) { id_corte }
  }
`;

export const UPDATE_CORTE = `
  mutation UpdateCorteVendedor($input: UpdateCorteVendedorInput!) {
    updateCorteVendedor(updateCorteVendedorInput: $input) { id_corte }
  }
`;

export const DELETE_CORTE = `
  mutation RemoveCorteVendedor($id: Int!) { removeCorteVendedor(id_corte: $id) }
`;

// ─── Producción ───────────────────────────────────────────────────────────────

export const GET_ORDENES_PRODUCCION = `
  query {
    ordenesProduccion {
      id_orden_produccion
      cantidad_a_producir
      fecha_orden
      estado
      producto { id_producto nombre sku }
      empleado { id_empleado nombre_completo }
      detalles {
        id_det_orden
        cantidad_consumida
        insumo { id_insumo nombre unidad_medida }
      }
    }
  }
`;

export const CREATE_ORDEN_PRODUCCION = `
  mutation CreateOrdenProduccion($input: CreateOrdenProduccionInput!) {
    createOrdenProduccion(createOrdenProduccionInput: $input) {
      id_orden_produccion
      estado
    }
  }
`;

export const UPDATE_ORDEN_PRODUCCION = `
  mutation UpdateOrdenProduccion($input: UpdateOrdenProduccionInput!) {
    updateOrdenProduccion(updateOrdenProduccionInput: $input) {
      id_orden_produccion
      estado
    }
  }
`;

// ─── Predicciones ERP ─────────────────────────────────────────────────────────

export const PREDICCION_VENTAS = `
  query PrediccionVentas($mesesHistorico: Int, $factorS: Float) {
    prediccionVentasProximoMes(mesesHistorico: $mesesHistorico, factorS: $factorS) {
      mes_predicho
      ventas_esperadas
      factor_alpha
      crecimiento_pct
      confianza_pct
    }
  }
`;

export const PREDICCION_DEMANDA_PRODUCTOS = `
  query PrediccionDemandaProductos($factorS: Float) {
    prediccionDemandaInventario(factorS: $factorS) {
      producto
      piezas_necesarias
      tendencia
      confianza_pct
    }
  }
`;
