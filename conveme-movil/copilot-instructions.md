# Instrucciones para GitHub Copilot en Convemeapp

Este proyecto es una aplicación móvil/web construida con React Native (y posiblemente React web).

## Objetivos principales

1. Diseñar pantallas con un UI/UX moderno, limpio y profesional.
2. Mantener una arquitectura clara y escalable.
3. Hacer revisiones de código profundas usando el contexto de todo el repositorio.

## Estilo de desarrollo

- Usar componentes funcionales con hooks.
- Reutilizar componentes comunes (botones, inputs, cards, listas, headers).
- Mantener un sistema de diseño consistente (spacing, tipografías, colores, tema global).
- Respetar el sistema de navegación y estilos ya definido en el proyecto.

## Cuando ayudes a escribir código

1. Antes de proponer código, revisa brevemente archivos relacionados (componentes, hooks, estilos, navegación).
2. Propón estructuras claras, separando lógica y presentación cuando tenga sentido.
3. Incluye estilos bien pensados: márgenes, paddings, tamaños de fuente, alineaciones y colores.
4. Si hay un theme o sistema de estilos, úsalo (no inventes otro a menos que el usuario lo pida).
5. Explica brevemente las decisiones importantes de diseño cuando sea útil.

## Cuando revises código

1. Resume primero qué hace el archivo.
2. Señala problemas por categorías:
   - Legibilidad
   - Arquitectura
   - Performance
   - Posibles bugs y edge cases
3. Propón refactorizaciones concretas con ejemplos de código.
4. Ten en cuenta el contexto del resto del repositorio que ya hayas visto en esta sesión.
