// src/logger.js
const winston = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');

const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console(),
    new WinstonCloudWatch({
      logGroupName: process.env.CLOUDWATCH_LOG_GROUP || 'cineprofile-backend',
      logStreamName: process.env.CLOUDWATCH_LOG_STREAM || 'app',
      awsRegion: process.env.AWS_REGION || 'eu-central-1',
      jsonMessage: true
    })
  ]
});

module.exports = logger;
