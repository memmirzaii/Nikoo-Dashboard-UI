/**
 * Nikoo AI Dashboard - Controller Agent
 * شناسه سند: NIKOO-MVP-TECH-001
 * نسخه: 1.0
 * 
 * ایجنت مدیریت مرکزی هارنس
 * مسئولیت‌ها:
 * - هماهنگی بین ایجنت‌ها
 * - مدیریت صف وظایف
 * - اجرا کردن گردش کار
 * - مدیریت رویدادها
 */

const path = require('path');
const { BaseAgent } = require('../shared/agent-base');
const { createLogger } = require('../shared/logger');
const { getConfig, PROJECT_ROOT } = require('../shared/harness-config');
const { eventBus, SYSTEM_EVENTS, PROJECT_EVENTS } = require('../shared/events');
const { generateId, timestamp, sleep } = require('../shared/utils');

class ControllerAgent extends BaseAgent {
  constructor() {
    super('controller', { logLevel: 'info' });
    this.config = getConfig('controller');
    this.logger = createLogger('controller');
    
    // صف وظایف
    this.taskQueue = [];
    this.currentTasks = new Map();
    this.completedTasks = [];
    this.failedTasks = [];
    
    // ایجنت‌ها
    this.agents = new Map();
    this.registeredAgents = new Set();
    
    // گردش کار
    this.workflow = null;
    this.currentStep = 0;
    this.workflowStatus = 'idle';
    
    // متغیرهای حالت
    this.isRunning = false;
    this.startTime = null;
    
    // ثبت رویدادهای سیستمی
    this.setupSystemEvents();
  }

  /**
   * تنظیم رویدادهای سیستمی
   */
  setupSystemEvents() {
    // رویداد شروع هارنس
    eventBus.on(SYSTEM_EVENTS.HARNESS_STARTED, (data) => {
      this.logger.info('Harness started', { data });
      this.isRunning = true;
      this.startTime = timestamp();
    });
    
    // رویداد توقف هارنس
    eventBus.on(SYSTEM_EVENTS.HARNESS_STOPPED, (data) => {
      this.logger.info('Harness stopped', { data });
      this.isRunning = false;
    });
    
    // رویداد خطا در ایجنت‌ها
    eventBus.on(SYSTEM_EVENTS.AGENT_ERROR, (data) => {
      this.logger.error(`Agent error: ${data.name}`, { error: data.error });
      this.handleAgentError(data);
    });
    
    // رویداد تکمیل وظیفه
    eventBus.on(SYSTEM_EVENTS.TASK_COMPLETED, (data) => {
      this.logger.info(`Task completed: ${data.task}`, { 
        agent: data.agent,
        duration: data.duration
      });
      this.handleTaskComplete(data);
    });
    
    // رویداد شکست وظیفه
    eventBus.on(SYSTEM_EVENTS.TASK_FAILED, (data) => {
      this.logger.error(`Task failed: ${data.task}`, { 
        agent: data.agent,
        error: data.error
      });
      this.handleTaskFailed(data);
    });
    
    // رویدادهای دروازه‌ها
    eventBus.on(SYSTEM_EVENTS.GATE_PASSED, (data) => {
      this.logger.success(`Gate passed: ${data.gateName}`, { criteria: data.criteria });
    });
    
    eventBus.on(SYSTEM_EVENTS.GATE_FAILED, (data) => {
      this.logger.error(`Gate failed: ${data.gateName}`, { 
        criteria: data.criteria,
        reason: data.reason
      });
    });
  }

  /**
   * متد start سفارشی
   */
  async onStart() {
    this.logger.info('Controller agent starting...');
    await this.initialize();
    
    // شروع هارنس
    this.startHarness();
  }

  /**
   * مقداردهی اولیه
   */
  async initialize() {
    this.logger.info('Initializing controller agent...');
    
    // بارگذاری گردش کار
    await this.loadWorkflow();
    
    // ثبت ایجنت‌های سیستمی
    await this.registerSystemAgents();
    
    this.logger.success('Controller agent initialized successfully');
  }

  /**
   * بارگذاری گردش کار
   */
  async loadWorkflow() {
    try {
      const workflowPath = this.config.workflowFile;
      const fs = require('fs');
      
      if (fs.existsSync(workflowPath)) {
        const workflowContent = fs.readFileSync(workflowPath, 'utf8');
        this.workflow = JSON.parse(workflowContent);
        this.logger.info('Workflow loaded from file', { path: workflowPath });
      } else {
        // گردش کار پیش‌فرض
        this.workflow = this.getDefaultWorkflow();
        this.logger.info('Using default workflow');
      }
      
      return this.workflow;
    } catch (error) {
      this.logger.error('Failed to load workflow', { error: error.message });
      this.workflow = this.getDefaultWorkflow();
      return this.workflow;
    }
  }

  /**
   * گردش کار پیش‌فرض
   */
  getDefaultWorkflow() {
    return {
      name: 'Nikoo Dashboard MVP Workflow',
      version: '1.0',
      steps: [
        {
          id: 'step-0',
          name: 'Memizi Avalie (Auditor)',
          agent: 'auditor',
          task: 'scanProject',
          description: 'بررسی اولیه پروژه توسط ایجنت ممیزی',
          required: true,
          gate: {
            name: 'Initial Audit Gate',
            criteria: ['QA-09', 'QA-11']
          }
        },
        {
          id: 'step-1',
          name: 'Tasbit Moshakhasat (Controller)',
          agent: 'controller',
          task: 'validateSpecs',
          description: 'تثبیت مشخصات پروژه',
          required: true
        },
        {
          id: 'step-2',
          name: 'Tarahi System (UI Designer)',
          agent: 'ui-designer',
          task: 'createDesignSystem',
          description: 'ایجاد سیستم طراحی',
          required: true
        },
        {
          id: 'step-3',
          name: 'Tosee Rabet Paye (Frontend Dev)',
          agent: 'frontend-dev',
          task: 'createBaseStructure',
          description: 'ایجاد ساختار پایه رابط کاربری',
          required: true
        },
        {
          id: 'step-4',
          name: 'Tosee Modulha (Frontend Dev + AI Interface)',
          agent: ['frontend-dev', 'ai-interface'],
          task: 'developModules',
          description: 'توسعه ماژول‌ها و کامپوننت‌ها',
          required: true
        },
        {
          id: 'step-5',
          name: 'Rabet Hosh Masnoei (AI Interface)',
          agent: 'ai-interface',
          task: 'createMockAdapter',
          description: 'پیاده‌سازی آداپتر Mock برای هوش مصنوعی',
          required: true
        },
        {
          id: 'step-6',
          name: 'Azmoon va Eslah (QA Agent)',
          agent: 'qa',
          task: 'runAllAcceptanceCriteria',
          description: 'اجرا آزمون‌ها و بررسی معیارهای پذیرش',
          required: true,
          gate: {
            name: 'QA Gate',
            criteria: ['QA-01', 'QA-02', 'QA-03', 'QA-04', 'QA-05', 'QA-06', 'QA-07', 'QA-08', 'QA-10', 'QA-12']
          }
        },
        {
          id: 'step-7',
          name: 'Baste Bandi (Release Agent)',
          agent: 'release',
          task: 'createPackage',
          description: 'بسته‌بندی نهایی پروژه',
          required: true
        },
        {
          id: 'step-8',
          name: 'Taeed Tahvil (Controller)',
          agent: 'controller',
          task: 'finalValidation',
          description: 'تأیید نهایی تحویل',
          required: true
        }
      ]
    };
  }

  /**
   * ثبت ایجنت‌های سیستمی
   */
  async registerSystemAgents() {
    this.logger.info('Registering system agents...');
    
    // ثبت ایجنت‌های از پیش تعریف شده
    const systemAgents = [
      { name: 'auditor', path: '../auditor/index.js' },
      { name: 'qa', path: '../qa/index.js' }
    ];
    
    for (const agent of systemAgents) {
      try {
        await this.registerAgent(agent.name, agent.path);
      } catch (error) {
        this.logger.warn(`Failed to register agent: ${agent.name}`, { error: error.message });
      }
    }
  }

  /**
   * ثبت یک ایجنت جدید
   */
  async registerAgent(name, agentPath) {
    this.logger.info(`Registering agent: ${name}`);
    
    try {
      // بررسی اینکه آیا ایجنت قبلاً ثبت شده است
      if (this.registeredAgents.has(name)) {
        this.logger.warn(`Agent ${name} is already registered`);
        return this.agents.get(name);
      }
      
      // لود کردن ایجنت
      let agentModule;
      if (path.isAbsolute(agentPath)) {
        agentModule = require(agentPath);
      } else {
        agentModule = require(path.join(__dirname, agentPath));
      }
      
      // بررسی اینکه آیا ایجنت از BaseAgent ارث‌بری کرده است
      const { BaseAgent } = require('../shared/agent-base');
      if (!(agentModule instanceof BaseAgent)) {
        throw new Error(`Agent ${name} must extend BaseAgent`);
      }
      
      // ذخیره ایجنت
      this.agents.set(name, agentModule);
      this.registeredAgents.add(name);
      
      // شروع ایجنت
      await agentModule.start();
      
      // ارسال رویداد
      eventBus.emit(SYSTEM_EVENTS.AGENT_REGISTERED, { name, id: agentModule.id });
      
      this.logger.success(`Agent ${name} registered and started successfully`);
      return agentModule;
    } catch (error) {
      this.logger.error(`Failed to register agent: ${name}`, { error: error.message });
      throw error;
    }
  }

  /**
   * دریافت یک ایجنت
   */
  getAgent(name) {
    return this.agents.get(name);
  }

  /**
   * لیست ایجنت‌ها
   */
  listAgents() {
    return Array.from(this.agents.entries()).map(([name, agent]) => ({
      name,
      id: agent.id,
      status: agent.status,
      startedAt: agent.startedAt
    }));
  }

  /**
   * شروع هارنس
   */
  startHarness() {
    this.logger.info('Starting harness...');
    
    this.isRunning = true;
    this.startTime = timestamp();
    
    // ارسال رویداد شروع
    eventBus.emit(SYSTEM_EVENTS.HARNESS_STARTED, { 
      timestamp: this.startTime,
      controller: this.id
    });
    
    this.logger.success('Harness started successfully');
    return true;
  }

  /**
   * توقف هارنس
   */
  async stopHarness() {
    this.logger.info('Stopping harness...');
    
    try {
      // توقف تمام ایجنت‌ها
      for (const [name, agent] of this.agents) {
        try {
          await agent.stop();
        } catch (error) {
          this.logger.error(`Failed to stop agent: ${name}`, { error: error.message });
        }
      }
      
      this.isRunning = false;
      
      // ارسال رویداد توقف
      eventBus.emit(SYSTEM_EVENTS.HARNESS_STOPPED, { 
        timestamp: timestamp(),
        controller: this.id
      });
      
      this.logger.success('Harness stopped successfully');
      return true;
    } catch (error) {
      this.logger.error('Failed to stop harness', { error: error.message });
      return false;
    }
  }

  /**
   * اجرا کردن گردش کار
   */
  async runWorkflow(options = {}) {
    this.logger.info('Running workflow...', { workflow: this.workflow.name });
    
    this.workflowStatus = 'running';
    this.currentStep = 0;
    
    try {
      for (let i = 0; i < this.workflow.steps.length; i++) {
        const step = this.workflow.steps[i];
        this.currentStep = i;
        
        this.logger.info(`Executing step ${i + 1}/${this.workflow.steps.length}: ${step.name}`);
        
        // بررسی اینکه آیا مرحله ضروری است
        if (step.required) {
          // اجرا کردن مرحله
          const result = await this.executeStep(step);
          
          // بررسی دروازه‌ها
          if (step.gate && !result.success) {
            this.logger.error(`Gate failed at step ${i + 1}: ${step.name}`);
            this.workflowStatus = 'failed';
            return {
              success: false,
              step: i,
              error: `Gate failed: ${step.gate.name}`
            };
          }
          
          // بررسی نتیجه مرحله
          if (!result.success) {
            this.logger.error(`Step failed: ${step.name}`);
            this.workflowStatus = 'failed';
            return {
              success: false,
              step: i,
              error: result.error
            };
          }
        } else {
          this.logger.info(`Skipping optional step: ${step.name}`);
        }
      }
      
      this.workflowStatus = 'completed';
      this.logger.success('Workflow completed successfully');
      
      return {
        success: true,
        steps: this.workflow.steps.length,
        duration: Date.now() - new Date(this.startTime)
      };
    } catch (error) {
      this.workflowStatus = 'failed';
      this.logger.error('Workflow failed', { error: error.message });
      return {
        success: false,
        step: this.currentStep,
        error: error.message
      };
    }
  }

  /**
   * اجرا کردن یک مرحله از گردش کار
   */
  async executeStep(step) {
    this.logger.info(`Executing step: ${step.name}`);
    
    try {
      // اگر مرحله چند ایجنت دارد
      if (Array.isArray(step.agent)) {
        const results = [];
        
        for (const agentName of step.agent) {
          const result = await this.executeAgentTask(agentName, step.task, step.params);
          results.push(result);
        }
        
        // بررسی اینکه آیا تمام ایجنت‌ها موفق بوده‌اند
        const allSuccess = results.every(r => r.success);
        
        // بررسی دروازه
        if (step.gate && allSuccess) {
          const gateResult = await this.checkGate(step.gate);
          if (!gateResult.passed) {
            return {
              success: false,
              step: step.id,
              error: `Gate failed: ${step.gate.name}`,
              gateResult
            };
          }
        }
        
        return {
          success: allSuccess,
          step: step.id,
          results
        };
      } else {
        // مرحله با یک ایجنت
        const result = await this.executeAgentTask(step.agent, step.task, step.params);
        
        // بررسی دروازه
        if (step.gate && result.success) {
          const gateResult = await this.checkGate(step.gate);
          if (!gateResult.passed) {
            return {
              success: false,
              step: step.id,
              error: `Gate failed: ${step.gate.name}`,
              gateResult
            };
          }
        }
        
        return result;
      }
    } catch (error) {
      this.logger.error(`Failed to execute step: ${step.name}`, { error: error.message });
      return {
        success: false,
        step: step.id,
        error: error.message
      };
    }
  }

  /**
   * اجرا کردن وظیفه یک ایجنت
   */
  async executeAgentTask(agentName, taskName, params = {}) {
    this.logger.info(`Executing task: ${taskName} on agent: ${agentName}`);
    
    try {
      // دریافت ایجنت
      const agent = this.getAgent(agentName);
      
      if (!agent) {
        throw new Error(`Agent ${agentName} not found`);
      }
      
      // بررسی اینکه آیا وظیفه وجود دارد
      if (!agent.tasks || !agent.tasks[taskName]) {
        throw new Error(`Task ${taskName} not found in agent ${agentName}`);
      }
      
      // ایجاد ID وظیفه
      const taskId = generateId();
      
      // اضافه کردن به صف
      this.addToQueue({ agent: agentName, task: taskName, params, taskId });
      
      // اجرا کردن وظیفه
      const result = await agent.executeTask(taskName, params, { 
        id: taskId,
        retry: this.config.retryPolicy
      });
      
      // حذف از صف فعلی
      this.currentTasks.delete(taskId);
      
      // اضافه کردن به لیست تکمیل شده
      this.completedTasks.push({ taskId, agent: agentName, task: taskName, result });
      
      this.logger.success(`Task completed: ${taskName} on agent: ${agentName}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to execute task: ${taskName} on agent: ${agentName}`, { 
        error: error.message 
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * بررسی دروازه
   */
  async checkGate(gate) {
    this.logger.info(`Checking gate: ${gate.name}`);
    
    try {
      const criteria = gate.criteria || [];
      const results = [];
      
      for (const criteriaId of criteria) {
        // دریافت ایجنت QA
        const qaAgent = this.getAgent('qa');
        
        if (qaAgent) {
          const result = await qaAgent.runAcceptanceCriteria(criteriaId);
          results.push(result);
          
          // ارسال رویداد
          if (result.passed) {
            eventBus.emit(SYSTEM_EVENTS.GATE_PASSED, { 
              gateName: gate.name,
              criteria: criteriaId
            });
          } else {
            eventBus.emit(SYSTEM_EVENTS.GATE_FAILED, { 
              gateName: gate.name,
              criteria: criteriaId,
              reason: result.error || result.recommendation
            });
          }
        } else {
          // اگر ایجنت QA در دسترس نیست، بررسی دستی انجام دهید
          results.push({
            criteria: criteriaId,
            passed: false,
            error: 'QA Agent not available'
          });
        }
      }
      
      // بررسی اینکه آیا تمام معیارها پاس شده‌اند
      const allPassed = results.every(r => r.passed);
      
      return {
        gate: gate.name,
        passed: allPassed,
        criteria: results
      };
    } catch (error) {
      this.logger.error(`Failed to check gate: ${gate.name}`, { error: error.message });
      return {
        gate: gate.name,
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * اضافه کردن وظیفه به صف
   */
  addToQueue(task) {
    this.taskQueue.push(task);
    this.currentTasks.set(task.taskId, task);
    
    this.logger.debug(`Task added to queue: ${task.task}`, { 
      agent: task.agent,
      taskId: task.taskId
    });
    
    // ارسال رویداد
    eventBus.emit(SYSTEM_EVENTS.TASK_QUEUED, task);
  }

  /**
   * دریافت وظیفه بعدی از صف
   */
  getNextTask() {
    if (this.taskQueue.length === 0) {
      return null;
    }
    
    const task = this.taskQueue.shift();
    return task;
  }

  /**
   * مدیریت تکمیل وظیفه
   */
  handleTaskComplete(data) {
    this.logger.info(`Task completed: ${data.task}`, { 
      agent: data.agent,
      taskId: data.taskId,
      duration: data.duration
    });
    
    // حذف از وظایف فعلی
    this.currentTasks.delete(data.taskId);
    
    // اضافه کردن به لیست تکمیل شده
    this.completedTasks.push(data);
  }

  /**
   * مدیریت شکست وظیفه
   */
  handleTaskFailed(data) {
    this.logger.error(`Task failed: ${data.task}`, { 
      agent: data.agent,
      taskId: data.taskId,
      error: data.error
    });
    
    // حذف از وظایف فعلی
    this.currentTasks.delete(data.taskId);
    
    // اضافه کردن به لیست شکست‌ها
    this.failedTasks.push(data);
  }

  /**
   * مدیریت خطا در ایجنت
   */
  handleAgentError(data) {
    this.logger.error(`Agent error: ${data.name}`, { error: data.error });
    
    // توقف ایجنت
    const agent = this.getAgent(data.name);
    if (agent) {
      agent.stop().catch(err => {
        this.logger.error(`Failed to stop agent after error: ${data.name}`, { error: err.message });
      });
    }
  }

  /**
   * اجرا کردن یک وظیفه سفارشی
   */
  tasks = {
    /**
     * بررسی مشخصات پروژه
     */
    validateSpecs: async (params = {}) => {
      this.logger.info('Validating project specifications...');
      
      try {
        // بررسی ساختار پوشه‌ها
        const requiredDirs = [
          'agents',
          'assets',
          'components',
          'pages',
          'tests',
          'docs',
          'config',
          'scripts'
        ];
        
        const missingDirs = [];
        for (const dir of requiredDirs) {
          const dirPath = path.join(PROJECT_ROOT, dir);
          if (!require('fs').existsSync(dirPath)) {
            missingDirs.push(dir);
          }
        }
        
        if (missingDirs.length > 0) {
          return {
            success: false,
            error: `Missing required directories: ${missingDirs.join(', ')}`,
            missingDirs
          };
        }
        
        // بررسی فایل‌های ضروری
        const requiredFiles = [
          'package.json',
          'index.html'
        ];
        
        const missingFiles = [];
        for (const file of requiredFiles) {
          const filePath = path.join(PROJECT_ROOT, file);
          if (!require('fs').existsSync(filePath)) {
            missingFiles.push(file);
          }
        }
        
        if (missingFiles.length > 0) {
          return {
            success: false,
            error: `Missing required files: ${missingFiles.join(', ')}`,
            missingFiles
          };
        }
        
        this.logger.success('Project specifications validated successfully');
        return {
          success: true,
          message: 'All project specifications are valid'
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    },

    /**
     * تأیید نهایی تحویل
     */
    finalValidation: async (params = {}) => {
      this.logger.info('Performing final validation...');
      
      try {
        // بررسی اینکه آیا تمام معیارهای پذیرش پاس شده‌اند
        const qaAgent = this.getAgent('qa');
        
        if (qaAgent) {
          const results = await qaAgent.runAllAcceptanceCriteria();
          
          if (!results.allCriteriaPassed()) {
            return {
              success: false,
              error: 'Some acceptance criteria failed',
              failedCriteria: results.getTestResults().details
                .filter(d => !d.passed)
                .map(d => d.criteria)
            };
          }
        }
        
        // بررسی گزارش ممیزی
        const auditorAgent = this.getAgent('auditor');
        if (auditorAgent) {
          const auditResults = auditorAgent.getAuditResults();
          
          if (auditResults.securityIssues.length > 0) {
            return {
              success: false,
              error: 'Security issues found in audit',
              securityIssues: auditResults.securityIssues
            };
          }
        }
        
        this.logger.success('Final validation passed successfully');
        return {
          success: true,
          message: 'All validations passed, project is ready for delivery'
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    },

    /**
     * اجرا کردن یک وظیفه دلخواه
     */
    runCustomTask: async (params = {}) => {
      const { agent, task, taskParams } = params;
      
      if (!agent || !task) {
        return {
          success: false,
          error: 'Agent and task are required'
        };
      }
      
      return this.executeAgentTask(agent, task, taskParams);
    },

    /**
     * دریافت وضعیت هارنس
     */
    getHarnessStatus: async (params = {}) => {
      return {
        success: true,
        status: {
          isRunning: this.isRunning,
          startTime: this.startTime,
          uptime: this.startTime ? Date.now() - new Date(this.startTime) : 0,
          workflowStatus: this.workflowStatus,
          currentStep: this.currentStep,
          agents: this.listAgents(),
          queue: {
            pending: this.taskQueue.length,
            current: this.currentTasks.size,
            completed: this.completedTasks.length,
            failed: this.failedTasks.length
          }
        }
      };
    }
  };

  /**
   * دریافت گزارش کامل
   */
  getReport() {
    return {
      ...super.getReport(),
      workflow: this.workflow,
      workflowStatus: this.workflowStatus,
      currentStep: this.currentStep,
      agents: this.listAgents(),
      queue: {
        pending: this.taskQueue.length,
        current: this.currentTasks.size,
        completed: this.completedTasks.length,
        failed: this.failedTasks.length
      }
    };
  }

  /**
   * دریافت وضعیت گردش کار
   */
  getWorkflowStatus() {
    return {
      status: this.workflowStatus,
      currentStep: this.currentStep,
      totalSteps: this.workflow?.steps.length || 0,
      workflow: this.workflow
    };
  }
}

// ایجاد و صادرات ایجنت
const controllerAgent = new ControllerAgent();
module.exports = controllerAgent;
