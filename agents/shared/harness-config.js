/**
 * Nikoo AI Dashboard - Agent Harness Configuration
 * شناسه سند: NIKOO-MVP-TECH-001
 * نسخه: 1.0
 * 
 * این فایل پیکربندی مرکزی برای سیستم ایجنت هارنس است.
 * تمام ایجنت‌ها از این تنظیمات استفاده می‌کنند.
 */

const path = require('path');
const { v4: uuidv4 } = require('uuid');

// مسیر پایه پروژه
const PROJECT_ROOT = path.resolve(__dirname, '../../');

// پیکربندی ایجنت‌ها
const AGENTS_CONFIG = {
  // تنظیمات عمومی
  general: {
    projectName: 'Nikoo AI Dashboard',
    projectId: 'NIKOO-MVP-TECH-001',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info', // debug, info, warn, error
    tempDir: path.join(PROJECT_ROOT, '.harness-temp'),
    outputDir: path.join(PROJECT_ROOT, 'dist'),
    maxRetries: 3,
    timeout: 30000 // میلی‌ثانیه
  },

  // تنظیمات ایجنت‌ها
  agents: {
    // ایجنت ممیزی (Auditor)
    auditor: {
      enabled: true,
      readOnly: true,
      scanPatterns: ['**/*.{js,css,html,json,md}'],
      excludePatterns: ['node_modules/**', 'dist/**', '.git/**', '.harness-temp/**'],
      reportFile: path.join(PROJECT_ROOT, 'reports/audit-report.json'),
      checks: {
        fileExistence: true,
        filePermissions: true,
        dependencyCheck: true,
        securityScan: false // در نسخه MVP غیرفعال
      }
    },

    // ایجنت کنترلر (Controller)
    controller: {
      enabled: true,
      workflowFile: path.join(PROJECT_ROOT, 'config/workflow.json'),
      queueSystem: 'memory', // memory, redis, rabbitmq
      maxConcurrentTasks: 5,
      taskTimeout: 60000,
      retryPolicy: {
        maxAttempts: 3,
        backoff: 1000 // میلی‌ثانیه
      }
    },

    // ایجنت طراح UI (UI Designer)
    'ui-designer': {
      enabled: true,
      designSystemFile: path.join(PROJECT_ROOT, 'docs/design-system.md'),
      tokenFile: path.join(PROJECT_ROOT, 'config/design-tokens.json'),
      rtlSupport: true,
      responsiveBreakpoints: [360, 768, 1024, 1440],
      colorSchemes: {
        primary: '#6366F1',
        secondary: '#8B5CF6',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        light: '#F8FAFC',
        dark: '#1E293B'
      }
    },

    // ایجنت توسعه‌دهنده Frontend
    'frontend-dev': {
      enabled: true,
      sourceDir: path.join(PROJECT_ROOT, 'assets/js'),
      componentsDir: path.join(PROJECT_ROOT, 'components'),
      pagesDir: path.join(PROJECT_ROOT, 'pages'),
      buildDir: path.join(PROJECT_ROOT, 'dist'),
      bundler: 'vite', // vite, webpack, esbuild
      minify: true,
      sourcemaps: process.env.NODE_ENV === 'development'
    },

    // ایجنت رابط هوش مصنوعی
    'ai-interface': {
      enabled: true,
      mockMode: true, // در نسخه MVP حتماً true باشد
      mockResponses: path.join(PROJECT_ROOT, 'data/mock-ai-responses.json'),
      apiEndpoint: process.env.AI_API_ENDPOINT || 'http://localhost:8000/api/ai',
      apiKey: process.env.AI_API_KEY || null,
      timeout: 10000,
      maxHistory: 50 // تعداد پیام‌های قبلی برای حفظ context
    },

    // ایجنت QA
    qa: {
      enabled: true,
      testDir: path.join(PROJECT_ROOT, 'tests'),
      reportDir: path.join(PROJECT_ROOT, 'reports/qa'),
      testFrameworks: ['jest', 'playwright'],
      coverage: {
        enabled: true,
        threshold: 80 // درصد پوشش کد
      },
      acceptanceCriteria: {
        // معیارهای پذیرش از ماده ۸ قرارداد
        QA_01: { name: 'Build Execution', required: true },
        QA_02: { name: 'Page Loading', required: true },
        QA_03: { name: 'RTL Support', required: true },
        QA_04: { name: 'Responsiveness', required: true },
        QA_05: { name: 'Interactions', required: true },
        QA_06: { name: 'State Handling', required: true },
        QA_07: { name: 'AI Interface', required: true },
        QA_08: { name: 'Accessibility', required: true },
        QA_09: { name: 'Security', required: true },
        QA_10: { name: 'Delivery Package', required: true },
        QA_11: { name: 'Licenses', required: true },
        QA_12: { name: 'Fixes Verification', required: true }
      }
    },

    // ایجنت انتشار (Release)
    release: {
      enabled: true,
      outputDir: path.join(PROJECT_ROOT, 'dist'),
      packageName: 'nikoo-dashboard-ui',
      zipFile: path.join(PROJECT_ROOT, 'releases/nikoo-dashboard-ui-v1.0.0.zip'),
      includeFiles: [
        'dist/**',
        'README.md',
        'LICENSE',
        'docs/**',
        'package.json'
      ],
      excludeFiles: [
        'node_modules/**',
        '.git/**',
        '.harness-temp/**',
        'reports/**'
      ],
      checksum: true,
      sign: false // در نسخه MVP غیرفعال
    }
  },

  // تنظیمات امنیتی
  security: {
    forbiddenPatterns: [
      /\.env/, /\.gitignore/, /\.npmrc/, /private.key/, /api[_-]?key/i, /password/i, /secret/i
    ],
    allowedEnvVars: ['NODE_ENV', 'AI_API_ENDPOINT', 'LOG_LEVEL'],
    sandbox: {
      enabled: false, // در آینده فعال خواهد شد
      type: 'docker' // docker, chroot, vm
    }
  },

  // تنظیمات GitHub
  github: {
    repo: 'memmirzaii/Nikoo-Dashboard-UI',
    branch: 'main',
    useActions: true,
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || null,
    token: process.env.GITHUB_TOKEN || null
  }
};

// تابع برای دریافت پیکربندی
function getConfig(agentName = null) {
  if (agentName) {
    return {
      ...AGENTS_CONFIG.general,
      ...AGENTS_CONFIG.agents[agentName],
      agentName,
      agentId: uuidv4()
    };
  }
  return AGENTS_CONFIG;
}

// تابع برای اعتبارسنجی پیکربندی
function validateConfig() {
  const errors = [];
  
  // بررسی وجود دایرکتوری‌ها
  const requiredDirs = [
    AGENTS_CONFIG.agents.auditor.reportFile,
    AGENTS_CONFIG.agents.qa.reportDir,
    AGENTS_CONFIG.agents['ui-designer'].designSystemFile
  ];
  
  requiredDirs.forEach(dir => {
    const dirPath = path.dirname(dir);
    // در اینجا فقط مسیر را بررسی می‌کنیم، ایجاد بعداً انجام می‌شود
  });
  
  // بررسی تنظیمات امنیتی
  if (AGENTS_CONFIG.security.sandbox.enabled && !AGENTS_CONFIG.security.sandbox.type) {
    errors.push('Sandbox type is required when sandbox is enabled');
  }
  
  // بررسی AI Interface
  if (!AGENTS_CONFIG.agents['ai-interface'].mockMode && !AGENTS_CONFIG.agents['ai-interface'].apiKey) {
    errors.push('AI API Key is required when mock mode is disabled');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  PROJECT_ROOT,
  AGENTS_CONFIG,
  getConfig,
  validateConfig
};
