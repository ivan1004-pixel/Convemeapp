import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CorteVendedor } from '../cortes-vendedor/entities/corte-vendedor.entity';
import { DetAsignacion } from '../asignaciones-vendedor/entities/det-asignacion.entity';
import { laplace } from '../common/laplace.util';

// Función auxiliar para obtener el mes
const porMes = (campo: string) => `DATE_FORMAT(${campo}, '%Y-%m')`;

@Injectable()
export class PrediccionesService {
    constructor(
        @InjectRepository(CorteVendedor) private corteRepo: Repository<CorteVendedor>,
        @InjectRepository(DetAsignacion) private detAsignacionRepo: Repository<DetAsignacion>,
    ) {}

    // ==============================================================
    //  1. PREDICCIÓN DE VENTAS (INGRESOS)
    // ==============================================================
    async prediccionVentasProximoMes(mesesHistorico = 6, factorS = 0.10) {
        const mes = porMes('corte.fecha_corte');

        const rows = await this.corteRepo
        .createQueryBuilder('corte')
        .select(mes, 'mes')
        .addSelect('SUM(corte.dinero_total_entregado)', 'total_ventas')
        .groupBy('mes')
        .orderBy('mes', 'DESC')
        .limit(mesesHistorico)
        .getRawMany();

        if (!rows.length) {
            return {
                mes_predicho: 'Próximo Mes',
                ventas_esperadas: 0,
                factor_alpha: Math.exp(-factorS),
                crecimiento_pct: 0,
                confianza_pct: 0,
                tendencia: 0,
                promedio_ponderado: 0
            };
        }

        const serieVentas = rows.map(r => +r.total_ventas || 0);
        const { prediccion, alpha, confianza_pct, tendencia, promedio_ponderado } = laplace(serieVentas, factorS);

        const ventasActuales = serieVentas[0] || 0;
        const crecimiento = ventasActuales > 0 ? ((prediccion - ventasActuales) / ventasActuales) * 100 : 0;

        return {
            mes_predicho: `Próximo a: ${rows[0].mes}`,
            ventas_esperadas: prediccion,
            factor_alpha: alpha,
            crecimiento_pct: parseFloat(crecimiento.toFixed(1)),
            confianza_pct,
            tendencia,
            promedio_ponderado
        };
    }

    // ==============================================================
    //  2. PREDICCIÓN DE DEMANDA DE PRODUCTOS
    // ==============================================================
    async prediccionDemandaInventario(factorS = 0.15) {
        const rows = await this.detAsignacionRepo
        .createQueryBuilder('det')
        .innerJoin('det.producto', 'prod')
        .innerJoin('det.asignacion', 'asig')
        .select('prod.nombre', 'producto')
        .addSelect('SUM(det.cantidad_asignada)', 'cantidad')
        .addSelect(porMes('asig.fecha_asignacion'), 'mes')
        .groupBy('prod.nombre')
        .addGroupBy(porMes('asig.fecha_asignacion'))
        .orderBy('mes', 'DESC')
        .getRawMany();

        if (!rows.length) return [];

        const porProducto = new Map<string, any[]>();
        rows.forEach(r => {
            if (!porProducto.has(r.producto)) porProducto.set(r.producto, []);
            porProducto.get(r.producto)!.push(r);
        });

        const resultados: any[] = [];

        porProducto.forEach((meses, producto) => {
            const serie = meses.map(m => +m.cantidad || 0);
            const { prediccion, confianza_pct, tendencia } = laplace(serie, factorS);

            resultados.push({
                producto,
                piezas_necesarias: Math.ceil(prediccion),
                tendencia,
                confianza_pct
            });
        });

        return resultados.sort((a, b) => b.piezas_necesarias - a.piezas_necesarias);
    }
}
