module.exports = [
  {
    files: [
      'cloudinary/*.js', 
      'model/*.js', 
      'public/js/*.js', 
      'routes/*.js', 
      'views/*.ejs', 
      '*.js', 
      '*.ejs',
    ],
    ignores: ['app.js', 'node_modules/*'],
    rules: {
      indent: ["error", 2],
      "no-unused-vars": "warn",
      "no-console": "warn"
    }
  }
]
  