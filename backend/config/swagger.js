const swaggerJSDoc = require('swagger-jsdoc');
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'MERN Social API',
    version: '1.0.0',
    description: 'API documentation for MERN Social App',
  },
  servers: [
    {
      url: process.env.BACKEND_URL,
    },
  ],
  components: {
    securitySchemes: {
      CookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'token',
      },
    },
  },
  security: [{ CookieAuth: [] }],
};

const swaggerOptions = {
  swaggerDefinition,
  apis: ['./routes/*.js', './models/*.js'], // Adjust to your route/model file locations
};

module.exports = swaggerOptions;
