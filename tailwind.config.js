/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
            colors: {
                primary: '#2563eb',
            },
            backdropBlur: {
                md: '12px',
            },
        },
    },
    plugins: [],
};
