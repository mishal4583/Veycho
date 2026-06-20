// Tailwind v4 runs only where `@import "tailwindcss"` appears — i.e. the admin
// theme (app/(admin)/theme.css). The public marketing CSS (app/globals.css) has
// no Tailwind directives, so this plugin passes it through untouched.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
