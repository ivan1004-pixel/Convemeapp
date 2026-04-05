/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,jsx,ts,tsx}',
        './src/**/*.{js,jsx,ts,tsx}',
    ],
    presets: [require('nativewind/preset')],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Montserrat', 'sans-serif'],
                galada: ['Galada', 'sans-serif'], // <-- ¡Aquí está tu nueva fuente!
            },
            colors: {
                brand: {
                    pink: '#f88fea',
                    blue: '#0301ff',
                    beige: '#ede0d1',
                },
                dark: '#1A1A1A',
                background: '#ffffff',
            }
        },
    },
    plugins: [],
};
