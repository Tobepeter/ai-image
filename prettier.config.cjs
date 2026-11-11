/** @type {import('prettier').Config} */
module.exports = {
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindStylesheet: './src/styles/index.css',
  tabWidth: 2,
  printWidth: 200,
  singleQuote: true,
  trailingComma: 'es5',
  semi: false,
  arrowParens: 'avoid',
  jsxSingleQuote: true,
}
