/**
 * Nikoo AI Dashboard - Agent Harness Logger
 * شناسه سند: NIKOO-MVP-TECH-001
 * نسخه: 1.0
 * 
 * سیستم لاگ‌گیری مرکزی برای تمام ایجنت‌ها
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { getConfig } = require('./harness-config');

class Logger {
  constructor(agentName, options = {}) {
    const config = getConfig(agentName);
    this.agentName = agentName || 'system';
    this.logLevel = options.logLevel || config.logLevel || 'info';
    this.logFile = options.logFile || path.join(config.tempDir, 'logs', `${agentName}-${new Date().toISOString().split('T')[0]}.log`);
    this.colors = {
      debug: chalk.gray,
      info: chalk.blue,
      warn: chalk.yellow,
      error: chalk.red,
      success: chalk.green,
      agent: chalk.magenta
    };
    
    // ایجاد دایرکتوری لاگ‌ها
    this.ensureLogDir();
  }

  ensureLogDir() {
    const dir = path.dirname(this.logFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // سطوح لاگ
  debug(message, data = {}) {
    this.log('debug', message, data);
  }

  info(message, data = {}) {
    this.log('info', message, data);
  }

  warn(message, data = {}) {
    this.log('warn', message, data);
  }

  error(message, data = {}) {
    this.log('error', message, data);
  }

  success(message, data = {}) {
    this.log('success', message, data);
  }

  // تابع اصلی لاگ
  log(level, message, data = {}) {
    const levels = ['debug', 'info', 'warn', 'error'];
    if (levels.indexOf(level) < levels.indexOf(this.logLevel)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const agentTag = this.colors.agent(`[${this.agentName}]`);
    const levelTag = this.colors[level](`[${level.toUpperCase()}]`);
    
    // پیام کنسول
    const consoleMessage = `${chalk.gray(timestamp)} ${agentTag} ${levelTag} ${message}`;
    if (Object.keys(data).length > 0) {
      console.log(consoleMessage, chalk.gray(JSON.stringify(data)));
    } else {
      console.log(consoleMessage);
    }

    // نوشتن در فایل
    this.writeToFile(timestamp, level, message, data);
  }

  writeToFile(timestamp, level, message, data) {
    try {
      const logEntry = {
        timestamp,
        agent: this.agentName,
        level,
        message,
        data
      };
      
      const logString = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(this.logFile, logString, 'utf8');
    } catch (err) {
      console.error(chalk.red('Failed to write to log file:'), err.message);
    }
  }

  // لاگ برای رویدادهای خاص
  taskStart(taskName, taskId) {
    this.info(`Starting task: ${taskName}`, { taskId });
  }

  taskComplete(taskName, taskId, result) {
    this.success(`Completed task: ${taskName}`, { taskId, result });
  }

  taskFailed(taskName, taskId, error) {
    this.error(`Failed task: ${taskName}`, { taskId, error: error.message });
  }

  // لاگ برای دروازه‌های پذیرش
  gatePassed(gateName, criteria) {
    this.success(`Gate passed: ${gateName}`, { criteria });
  }

  gateFailed(gateName, criteria, reason) {
    this.error(`Gate failed: ${gateName}`, { criteria, reason });
  }

  // لاگ برای معیارهای پذیرش
  acceptancePassed(criteriaId, description) {
    this.success(`Acceptance passed: ${criteriaId}`, { description });
  }

  acceptanceFailed(criteriaId, description, reason) {
    this.error(`Acceptance failed: ${criteriaId}`, { description, reason });
  }
}

// ایجاد یک instance عمومی
function createLogger(agentName, options = {}) {
  return new Logger(agentName, options);
}

module.exports = {
  Logger,
  createLogger
};
