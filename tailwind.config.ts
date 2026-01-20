/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: ["./pages/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./app/**/*.{js,ts,jsx,tsx,mdx}", "*.{js,ts,jsx,tsx,mdx}"],
    theme: {
        screens: {
            'sm': '640px',
            'md': '768px',
            'lg': '1024px',
            'xl': '1280px',
            '2xl': '1536px',
            '3xl': '1920px',
            'tv': '2300px',
            '4xl': '2560px',
        },
        extend: {
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            fontFamily: {
                sans: ["var(--font-dm-sans)", "var(--font-noto-sans-arabic)", "sans-serif"],
                serif: ["var(--font-dm-serif)", "var(--font-noto-sans-arabic)", "serif"],
                display: ["var(--font-dm-serif)", "var(--font-noto-sans-arabic)", "sans-serif"],
            },
            colors: {
                // AFCON 2025 Morocco Brand palette 🇲🇦
                brand: {
                    primary: "#B8071C",       // أحمر العلم المغربي (تعديل نهائي)
                    primaryDark: "#910515",   // أحمر داكن hover (تعديل نهائي)
                    green: "#006233",         // أخضر العلم المغربي
                    greenDark: "#004D26",     // أخضر داكن
                    gold: "#DEB735",          // ذهبي (تعديل نهائي)
                    goldLight: "#F5E6C3",     // ذهبي فاتح
                    blue: "#103090",          // أزرق داكن (معدل)
                    cream: "#fffaf2",
                },
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
            },
            keyframes: {
                timerPulse: {
                    '0%, 100%': { transform: 'scale(1.1) translateY(-4px)' },
                    '50%': { transform: 'scale(1.12) translateY(-4.5px)' },
                },
            },
            animation: {
                timerPulse: 'timerPulse 1s ease-in-out infinite',
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
}
