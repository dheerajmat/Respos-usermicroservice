import winston from 'winston';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import 'winston-daily-rotate-file';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create logs directory with extra debug information
const logsDir = path.join(__dirname, 'logs');
console.log(`Attempting to create/access logs directory at: ${logsDir}`);

try {
  if (!fs.existsSync(logsDir)) {
    console.log('Logs directory does not exist, creating it now...');
    fs.mkdirSync(logsDir, { recursive: true });
    console.log('Logs directory created successfully');
  } else {
    console.log('Logs directory already exists');
  }
  
  // Check write permissions
  fs.accessSync(logsDir, fs.constants.W_OK);
  console.log('Write permissions confirmed for logs directory');
} catch (error) {
  console.error('Error creating or accessing logs directory:', error);
  // Create an alternative location as fallback
  const altLogsDir = path.join(process.cwd(), 'logs');
  console.log(`Attempting to use alternative logs directory: ${altLogsDir}`);
  
  try {
    if (!fs.existsSync(altLogsDir)) {
      fs.mkdirSync(altLogsDir, { recursive: true });
    }
    console.log('Using alternative logs directory');
    // Use alternative directory
    logsDir = altLogsDir;
  } catch (altError) {
    console.error('Error creating alternative logs directory:', altError);
    // Final fallback - use temp directory
    const os = await import('os');
    logsDir = path.join(os.tmpdir(), 'app-logs');
    console.log(`Falling back to temporary directory: ${logsDir}`);
    
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }
}

// Create a simple test file to verify write access
try {
  const testFile = path.join(logsDir, 'test-write.txt');
  fs.writeFileSync(testFile, 'Testing write access');
  console.log(`Successfully wrote test file to ${testFile}`);
  // Optional: Delete test file
  fs.unlinkSync(testFile);
} catch (writeError) {
  console.error('Error writing test file:', writeError);
}

// Define custom transport with daily rotation
const dailyRotateFileTransport = new winston.transports.DailyRotateFile({
  filename: 'combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  dirname: logsDir,
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: true,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  )
});

// Add error handler to transport
dailyRotateFileTransport.on('error', (error) => {
  console.error('Error in daily rotate file transport:', error);
});

// Define error transport with daily rotation
const errorRotateFileTransport = new winston.transports.DailyRotateFile({
  level: 'error',
  filename: 'error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  dirname: logsDir,
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: true,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  )
});

// Add error handler to transport
errorRotateFileTransport.on('error', (error) => {
  console.error('Error in error rotate file transport:', error);
});

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Rotating file transports
    dailyRotateFileTransport,
    errorRotateFileTransport
  ]
});

// Log initialization
logger.info('Logger initialized', { logsDirectory: logsDir });

// Set debug level for non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.level = 'debug';
  logger.debug('Debug logging enabled');
}

export default logger;