/**
 * Nikoo AI Dashboard - Base Agent Class
 * شناسه سند: NIKOO-MVP-TECH-001
 * نسخه: 1.0
 * 
 * کلاس پایه برای تمام ایجنت‌ها
 */

const { createLogger } = require('./logger');
const { getConfig } = require('./harness-config');
const { eventBus, SYSTEM_EVENTS } = require('./events');
const { generateId, timestamp } = require('./utils');

class BaseAgent {
  /**
   * ایجاد یک ایجنت جدید
   * @param {string} name - نام ایجنت
   * @param {object} options - تنظیمات ایجنت
   */
  constructor(name, options = {}) {
    // تنظیمات پایه
    this.name = name;
    this.id = options.id || generateId();
    this.config = getConfig(name);
    this.logger = createLogger(name, { logLevel: options.logLevel });
    
    // وضعیت ایجنت
    this.status = 'initialized';
    this.startedAt = null;
    this.endedAt = null;
    this.errors = [];
    this.metrics = {
      tasksCompleted: 0,
      tasksFailed: 0,
      executionTime: 0
    };
    
    // ثبت رویدادهای ایجنت
    this.setupEventListeners();
    
    // اعتبارسنجی پیکربندی
    this.validateConfig();
    
    this.logger.info(`Agent initialized: ${name}`, { id: this.id, status: this.status });
  }

  /**
   * تنظیم گوش‌دهندگان رویداد
   */
  setupEventListeners() {
    // گوش دادن به رویدادهای سیستمی
    eventBus.on(SYSTEM_EVENTS.HARNESS_STARTED, () => {
      this.logger.info('Harness started, agent is ready');
    });
    
    eventBus.on(SYSTEM_EVENTS.HARNESS_STOPPED, () => {
      this.logger.info('Harness stopped, agent is shutting down');
      this.stop();
    });
  }

  /**
   * اعتبارسنجی پیکربندی
   */
  validateConfig() {
    const configValidation = require('./harness-config').validateConfig();
    if (!configValidation.valid) {
      this.logger.warn('Configuration validation warnings', { errors: configValidation.errors });
    }
  }

  /**
   * شروع ایجنت
   */
  async start() {
    if (this.status !== 'initialized' && this.status !== 'stopped') {
      this.logger.warn(`Agent is already ${this.status}, cannot start`);
      return false;
    }
    
    try {
      this.status = 'starting';
      eventBus.emit(SYSTEM_EVENTS.AGENT_STARTED, { name: this.name, id: this.id });
      
      // اجرا کردن متد start سفارشی
      if (this.onStart) {
        await this.onStart();
      }
      
      this.status = 'running';
      this.startedAt = timestamp();
      this.logger.info(`Agent started successfully: ${this.name}`);
      
      return true;
    } catch (error) {
      this.status = 'error';
      this.logger.error(`Failed to start agent: ${this.name}`, { error: error.message });
      eventBus.emit(SYSTEM_EVENTS.AGENT_ERROR, { name: this.name, id: this.id, error: error.message });
      return false;
    }
  }

  /**
   * توقف ایجنت
   */
  async stop() {
    if (this.status !== 'running') {
      this.logger.warn(`Agent is not running, current status: ${this.status}`);
      return false;
    }
    
    try {
      this.status = 'stopping';
      
      // اجرا کردن متد stop سفارشی
      if (this.onStop) {
        await this.onStop();
      }
      
      this.status = 'stopped';
      this.endedAt = timestamp();
      this.metrics.executionTime = new Date(this.endedAt) - new Date(this.startedAt);
      
      eventBus.emit(SYSTEM_EVENTS.AGENT_STOPPED, { 
        name: this.name, 
        id: this.id, 
        metrics: this.metrics 
      });
      
      this.logger.info(`Agent stopped successfully: ${this.name}`, { metrics: this.metrics });
      return true;
    } catch (error) {
      this.status = 'error';
      this.logger.error(`Failed to stop agent: ${this.name}`, { error: error.message });
      return false;
    }
  }

  /**
   * اجرا کردن یک وظیفه
   * @param {string} taskName - نام وظیفه
   * @param {object} params - پارامترهای وظیفه
   * @param {object} options - تنظیمات وظیفه
   */
  async executeTask(taskName, params = {}, options = {}) {
    const taskId = options.id || generateId();
    const startTime = Date.now();
    
    this.logger.taskStart(taskName, taskId);
    eventBus.emit(SYSTEM_EVENTS.TASK_STARTED, { 
      agent: this.name, 
      task: taskName, 
      taskId,
      params 
    });
    
    try {
      // اجرا کردن وظیفه سفارشی
      if (this.tasks && this.tasks[taskName]) {
        const result = await this.tasks[taskName](params);
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        this.metrics.tasksCompleted++;
        this.logger.taskComplete(taskName, taskId, { duration, result });
        
        eventBus.emit(SYSTEM_EVENTS.TASK_COMPLETED, { 
          agent: this.name, 
          task: taskName, 
          taskId,
          duration,
          result 
        });
        
        return {
          success: true,
          result,
          taskId,
          duration,
          timestamp: timestamp()
        };
      } else {
        throw new Error(`Task ${taskName} not found in agent ${this.name}`);
      }
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.metrics.tasksFailed++;
      this.errors.push({ taskId, taskName, error: error.message, timestamp: timestamp() });
      
      this.logger.taskFailed(taskName, taskId, error);
      eventBus.emit(SYSTEM_EVENTS.TASK_FAILED, { 
        agent: this.name, 
        task: taskName, 
        taskId,
        duration,
        error: error.message 
      });
      
      // اگر retry فعال باشد
      if (options.retry && options.retry.maxAttempts) {
        const attempt = options.retry.attempt || 1;
        if (attempt < options.retry.maxAttempts) {
          this.logger.warn(`Retrying task: ${taskName}`, { 
            taskId, 
            attempt: attempt + 1,
            maxAttempts: options.retry.maxAttempts 
          });
          
          eventBus.emit(SYSTEM_EVENTS.TASK_RETRIED, { 
            agent: this.name, 
            task: taskName, 
            taskId,
            attempt: attempt + 1 
          });
          
          // تاخیر قبل از retry
          if (options.retry.delay) {
            await new Promise(resolve => setTimeout(resolve, options.retry.delay));
          }
          
          return this.executeTask(taskName, params, { 
            ...options, 
            retry: { 
              ...options.retry, 
              attempt: attempt + 1 
            } 
          });
        }
      }
      
      return {
        success: false,
        error: error.message,
        taskId,
        duration,
        timestamp: timestamp()
      };
    }
  }

  /**
   * ثبت یک رویداد سفارشی
   * @param {string} eventName - نام رویداد
   * @param {object} data - داده‌های رویداد
   */
  emitEvent(eventName, data = {}) {
    eventBus.emit(eventName, { 
      ...data,
      agent: this.name,
      agentId: this.id,
      timestamp: timestamp()
    });
    this.logger.debug(`Emitted event: ${eventName}`, { data });
  }

  /**
   * گوش دادن به یک رویداد سفارشی
   * @param {string} eventName - نام رویداد
   * @param {function} callback - تابع callback
   */
  onEvent(eventName, callback) {
    eventBus.on(eventName, (data) => {
      if (data.agent !== this.name) {
        callback(data);
      }
    });
  }

  /**
   * دریافت وضعیت فعلی ایجنت
   */
  getStatus() {
    return {
      name: this.name,
      id: this.id,
      status: this.status,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      metrics: this.metrics,
      errors: this.errors,
      config: this.config
    };
  }

  /**
   * بررسی سلامت ایجنت
   */
  healthCheck() {
    return {
      healthy: this.status === 'running' || this.status === 'initialized',
      status: this.status,
      errors: this.errors.length,
      lastError: this.errors[this.errors.length - 1]
    };
  }

  /**
   * دریافت گزارش فعالیت
   */
  getReport() {
    return {
      agent: this.name,
      id: this.id,
      status: this.status,
      uptime: this.startedAt ? new Date() - new Date(this.startedAt) : 0,
      metrics: this.metrics,
      errors: this.errors,
      config: {
        enabled: this.config.enabled,
        environment: this.config.environment
      }
    };
  }
}

/**
 * تابع کمکی برای ایجاد ایجنت
 */
function createAgent(name, options = {}) {
  return new BaseAgent(name, options);
}

module.exports = {
  BaseAgent,
  createAgent
};
