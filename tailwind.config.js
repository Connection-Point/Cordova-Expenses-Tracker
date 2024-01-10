/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./www/**/*.{html,js}', './node_modules/flowbite/**/*.js'],
    theme: {
        extend: {},
    },
    darkMode: 'class',
    plugins: [require('flowbite/plugin'), require('flowbite-typography')],
};
