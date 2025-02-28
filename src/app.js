import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import prisma from './config/prisma.js';
import responseHandler from './middleware/responseHandler.js';
import logger from './utils/logger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition']
}));

// Basic middleware
app.use(express.json());
app.use(responseHandler);

// Static files handling


// Performance Monitoring
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    });
    next();
});

// Define swagger options with more detailed configuration
const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Respos API Documentation -- User Microservice',
        version: '1.0.0',
        description: 'API Documentation with detailed specifications',
        contact: {
          name: 'API Support',
          email: 'support@yourdomain.com'
        },
        license: {
          name: 'Apache 2.0',
          url: 'http://www.apache.org/licenses/LICENSE-2.0.html'
        }
      },
      servers: [],  // We'll populate this dynamically
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
      security: [{
        bearerAuth: []
      }]
    },
    apis: ['./src/routes/*.js'],
  };

const specs = swaggerJsdoc(swaggerOptions);

app.use((req, res, next) => {
    if (req.path === '/swagger.json' || req.path === '/api-docs') {
      // Get host from request
      const host = req.get('host');
      const protocol = req.protocol;
      
      // Make a deep copy of the specs
      const dynamicSpecs = JSON.parse(JSON.stringify(specs));
      
      // Update servers array to use the actual host
      dynamicSpecs.servers = [
        {
          url: `${protocol}://${host}`,
          description: 'Current server'
        }
      ];
      
      // Attach the dynamic specs to the request for later use
      req.dynamicSwaggerSpecs = dynamicSpecs;
    }
    next();
  });

// Disable Helmet specifically for Swagger route
app.use('/api-docs', (req, res, next) => {
    const oldHelmet = app._router.stack.find(layer => layer.name === 'helmet');
    if (oldHelmet) {
        app._router.stack.splice(app._router.stack.indexOf(oldHelmet), 1);
    }
    next();
});

// Serve swagger specification as JSON
app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(req.dynamicSwaggerSpecs || specs);
  });

// Serve swagger docs with enhanced UI options
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', (req, res) => {
  return swaggerUi.setup(req.dynamicSwaggerSpecs || specs, {
    explorer: false,
    customSiteTitle: "API Documentation",
    swaggerOptions: {
      url: `${req.protocol}://${req.get('host')}/swagger.json`,
      persistAuthorization: true,
      displayRequestDuration: true,
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
      docExpansion: 'list',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      syntaxHighlight: {
        activate: false,
        theme: 'monokai'
      }
    }
  })(req, res);
});

// Routes
app.use('/api/v2', routes);

app.get('/', (req, res) => {
    res.send('Welcome to Respos API! Go to /api-docs for documentation');
});

// Error handling
app.use(errorHandler);

// Database connection test
const testDatabaseConnection = async () => {
    try {
        await prisma.$connect();
        logger.info('Successfully connected to the database');
    } catch (error) {
        logger.error('Error connecting to the database:', error);
        process.exit(1);
    }
};

// Ensure default image exists


// Start server
app.listen(port, async () => {
    await testDatabaseConnection();
 
    logger.info(`Server is running on http://localhost:${port}`);
    logger.info(`Swagger documentation available at http://localhost:${port}/api-docs`);
});



// Error handlers
process.on('unhandledRejection', (err) => {
    logger.info('UNHANDLED REJECTION! Shutting down...');
    logger.info(err.name, err.message);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    logger.info('UNCAUGHT EXCEPTION! Shutting down...');
    logger.info(err.name, err.message);
    process.exit(1);
});

export default app;