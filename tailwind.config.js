/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                halliburton: {
                    red: '#CC0000',
                    dark: '#1a1a1a',
                    gray: '#8E979D',
                    light: '#ECEFF0'
                }
            }
        }
    },
    plugins: [],
}
