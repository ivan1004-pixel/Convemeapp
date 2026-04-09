export function laplace(serie: number[], s: number) {
    const alpha = Math.exp(-s);
    let F = 0, W = 0;

    serie.forEach((valor, k) => {
        const peso = Math.pow(alpha, k);
        F += valor * peso;
        W += peso;
    });

    const prediccion = W > 0 ? F / W : 0;

    const tendencia = serie.length >= 2
    ? (serie[0] - serie[serie.length - 1]) / (serie.length - 1)
    : 0;

    const media = serie.reduce((acc, val) => acc + val, 0) / (serie.length || 1);
    const varianza = serie.reduce((acc, val) => acc + (val - media) ** 2, 0) / (serie.length || 1);
    const cv = media > 0 ? (Math.sqrt(varianza) / media) * 100 : 100;
    const confianza_pct = parseFloat(Math.max(0, Math.min(100, 100 - cv)).toFixed(1));

    return {
        prediccion: parseFloat(prediccion.toFixed(2)),
        alpha: parseFloat(alpha.toFixed(4)),
        confianza_pct,
        promedio_ponderado: parseFloat(prediccion.toFixed(2)),
        tendencia: parseFloat(tendencia.toFixed(4)),
    };
}
