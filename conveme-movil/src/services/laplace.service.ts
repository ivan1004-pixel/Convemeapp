import { convemeApi } from '../api/convemeApi';

/**
 * Servicio para calcular predicciones usando Laplace directamente en el móvil.
 * Adaptado de la lógica del backend:
 * F = sum(valor * alpha^k) / sum(alpha^k)
 */
export const calcularPrediccionLaplace = (serie: number[], s: number) => {
    const alpha = Math.exp(-s);
    let F = 0, W = 0;

    serie.forEach((valor, k) => {
        const peso = Math.pow(alpha, k);
        F += valor * peso;
        W += peso;
    });

    const prediccion = W > 0 ? F / W : 0;

    return {
        prediccion: parseFloat(prediccion.toFixed(2)),
    };
};
