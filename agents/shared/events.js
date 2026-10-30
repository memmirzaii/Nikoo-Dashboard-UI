/**
 * Nikoo AI Dashboard - Agent Harness Event System
 * شناسه سند: NIKOO-MVP-TECH-001
 * نسخه: 1.0
 * 
 * سیستم رویداد مرکزی برای ارتباط بین ایجنت‌ها
 */

const EventEmitter = require('events');
const { createLogger } = require('./logger');
const { getConfig } = require('./harness-config');

class HarnessEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.logger = createLogger('event-system');
    this.config = getConfig();
    this.setMaxListeners(20); // افزایش حد گوش‌دهندگان
    
    // ثبت رویدادهای سیستمی
    this.on('error', this.handleError.bind(this));
    this.on('newListener', this.logNewListener.bind(this));
    this.on('removeListener', this.logRemoveListener.bind(this));
  }

  handleError(error) {
    this.logger.error('Unhandled event error', { error: error.message });
  }

  logNewListener(event, listener) {
    this.logger.debug(`New listener for event: ${event}`);
  }

  logRemoveListener(event, listener) {
    this.logger.debug(`Removed listener for event: ${event}`);
  }

  // ارسال رویداد با لاگ
  emit(event, ...args) {
    this.logger.debug(`Emitting event: ${event}`, { args: args.length });
    return super.emit(event, ...args);
  }

  // ارسال رویداد با تأخیر
  emitLater(event, delay, ...args) {
    setTimeout(() => {
      this.emit(event, ...args);
    }, delay);
  }

  // ارسال رویداد به صورت غیرهمزمان
  async emitAsync(event, ...args) {
    this.logger.debug(`Emitting async event: ${event}`);
    const results = [];
    
    for (const listener of this.listeners(event)) {
      try {
        const result = await listener(...args);
        results.push({ success: true, result });
      } catch (error) {
        results.push({ success: false, error: error.message });
        this.logger.error(`Error in async event listener: ${event}`, { error: error.message });
      }
    }
    
    return results;
  }

  // ثبت رویداد با اولویت
  onWithPriority(event, listener, priority = 0) {
    const originalListeners = this.listeners(event);
    
    // حذف listener اگر قبلاً ثبت شده باشد
    this.removeListener(event, listener);
    
    // ثبت مجدد با اولویت
    this.on(event, listener);
    
    // مرتب‌سازی گوش‌دهندگان بر اساس اولویت (بالا به پایین)
    // این کار به صورت دستی انجام می‌شود
    this.logger.debug(`Registered listener for ${event} with priority ${priority}`);
    
    return this;
  }

  // ثبت رویداد یکبار مصرف
  onceAsync(event, listener) {
    const wrapper = async (...args) => {
      try {
        await listener(...args);
      } catch (error) {
        this.logger.error(`Error in onceAsync listener: ${event}`, { error: error.message });
        throw error;
      } finally {
        this.removeListener(event, wrapper);
      }
    };
    
    this.on(event, wrapper);
    return this;
  }

  // منتظر رویداد ماندن
  waitFor(event, options = {}) {
    const { timeout = this.config.timeout, filter = () => true } = options;
    
    return new Promise((resolve, reject) => {
      const listener = (...args) => {
        if (filter(...args)) {
          this.removeListener(event, listener);
          resolve(args);
        }
      };
      
      this.on(event, listener);
      
      // تنظیم timeout
      const timeoutId = setTimeout(() => {
        this.removeListener(event, listener);
        reject(new Error(`Timeout waiting for event: ${event}`));
      }, timeout);
      
      // تمیزکاری در صورت cancel شدن promise
      const cleanup = () => {
        clearTimeout(timeoutId);
        this.removeListener(event, listener);
      };
      
      // اضافه کردن متد cancel به promise
      const promise = Promise.race([
        new Promise((_, reject) => {
          promise.cancel = () => {
            cleanup();
            reject(new Error('Promise cancelled'));
          };
        }),
        new Promise((resolve) => {
          this.on(event, (data) => {
            if (filter(data)) {
              cleanup();
              resolve(data);
            }
          });
        })
      ]);
      
      promise.cancel = cleanup;
    });
  }

  // شمارش گوش‌دهندگان
  listenerCount(event) {
    return super.listenerCount(event);
  }

  // دریافت لیست رویدادهای ثبت شده
  eventNames() {
    return super.eventNames();
  }

  // پاک‌سازی تمام رویدادها
  clearAll() {
    this.removeAllListeners();
    this.logger.info('Cleared all event listeners');
  }
}

// ایجاد یک instance جهانی
const eventBus = new HarnessEventEmitter();

// رویدادهای استاندارد سیستم
const SYSTEM_EVENTS = {
  // رویدادهای چرخه زندگی
  HARNESS_STARTED: 'harness:started',
  HARNESS_STOPPED: 'harness:stopped',
  
  // رویدادهای ایجنت‌ها
  AGENT_REGISTERED: 'agent:registered',
  AGENT_STARTED: 'agent:started',
  AGENT_STOPPED: 'agent:stopped',
  AGENT_ERROR: 'agent:error',
  
  // رویدادهای وظایف
  TASK_QUEUED: 'task:queued',
  TASK_STARTED: 'task:started',
  TASK_COMPLETED: 'task:completed',
  TASK_FAILED: 'task:failed',
  TASK_RETRIED: 'task:retried',
  
  // رویدادهای دروازه‌ها
  GATE_PASSED: 'gate:passed',
  GATE_FAILED: 'gate:failed',
  
  // رویدادهای پذیرش
  ACCEPTANCE_PASSED: 'acceptance:passed',
  ACCEPTANCE_FAILED: 'acceptance:failed',
  
  // رویدادهای Build
  BUILD_STARTED: 'build:started',
  BUILD_COMPLETED: 'build:completed',
  BUILD_FAILED: 'build:failed',
  
  // رویدادهای تست
  TEST_STARTED: 'test:started',
  TEST_COMPLETED: 'test:completed',
  TEST_FAILED: 'test:failed',
  
  // رویدادهای GitHub
  GITHUB_PUSH: 'github:push',
  GITHUB_PULL_REQUEST: 'github:pull_request',
  GITHUB_ISSUE: 'github:issue'
};

// رویدادهای سفارشی پروژه
const PROJECT_EVENTS = {
  // رویدادهای طراحی
  DESIGN_SYSTEM_CREATED: 'design:system_created',
  DESIGN_TOKENS_UPDATED: 'design:tokens_updated',
  
  // رویدادهای توسعه
  COMPONENT_CREATED: 'dev:component_created',
  PAGE_CREATED: 'dev:page_created',
  
  // رویدادهای AI
  AI_MESSAGE_SENT: 'ai:message_sent',
  AI_RESPONSE_RECEIVED: 'ai:response_received',
  
  // رویدادهای QA
  QA_REPORT_GENERATED: 'qa:report_generated',
  QA_CRITERIA_PASSED: 'qa:criteria_passed',
  
  // رویدادهای انتشار
  PACKAGE_CREATED: 'release:package_created',
  RELEASE_READY: 'release:ready'
};

module.exports = {
  HarnessEventEmitter,
  eventBus,
  SYSTEM_EVENTS,
  PROJECT_EVENTS
};
