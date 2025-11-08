require('dotenv').config();
const winston = require('winston'); // tek require

const transports = [new winston.transports.Console()];

const enableCW = String(process.env.CLOUDWATCH_ENABLED || 'false').toLowerCase() === 'true';

if (enableCW) {
  try {
    const WinstonCloudWatch = require('winston-cloudwatch');
    transports.push(new WinstonCloudWatch({
      logGroupName: process.env.CLOUDWATCH_LOG_GROUP,
      logStreamName: process.env.CLOUDWATCH_LOG_STREAM || 'backend',
      awsRegion: process.env.AWS_REGION || 'eu-central-1',
      jsonMessage: true
    }));
  } catch (e) {
    console.error('CloudWatch logger devre dışı (yükleme hatası):', e.message);
  }
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.json(),
  transports
});

module.exports = logger;
