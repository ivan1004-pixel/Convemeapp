import { convemeApi } from '../api/convemeApi';

export interface PrediccionVentas {
  mes_predicho: string;
  ventas_esperadas: number;
  factor_alpha: number;
  crecimiento_pct: number;
  confianza_pct: number;
}

export interface PrediccionDemanda {
  producto: string;
  piezas_necesarias: number;
  tendencia: string;
  confianza_pct: number;
}

/**
 * Predice las ventas (ingresos) para el próximo mes usando Transformada de Laplace.
 * @param mesesHistorico - Número de meses históricos a considerar (default 6)
 * @param factorS        - Factor de Laplace, ej. 0.10 → α ≈ 0.90
 */
export const getPrediccionVentasService = async (
  mesesHistorico = 6,
  factorS = 0.1,
): Promise<PrediccionVentas> => {
  const query = `
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

  const { data } = await convemeApi.post('', {
    query,
    variables: { mesesHistorico, factorS },
  });

  if (data.errors) throw new Error(data.errors[0].message);
  return data.data.prediccionVentasProximoMes;
};

/**
 * Predice qué productos serán los más vendidos para hacer inventario.
 */
export const getPrediccionDemandaService = async (
  factorS = 0.1,
): Promise<PrediccionDemanda[]> => {
  const query = `
    query PrediccionDemandaProductos($factorS: Float) {
      prediccionDemandaInventario(factorS: $factorS) {
        producto
        piezas_necesarias
        tendencia
        confianza_pct
      }
    }
  `;

  const { data } = await convemeApi.post('', {
    query,
    variables: { factorS },
  });

  if (data.errors) throw new Error(data.errors[0].message);
  return data.data.prediccionDemandaInventario ?? [];
};
