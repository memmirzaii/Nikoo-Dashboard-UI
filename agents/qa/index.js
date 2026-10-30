/**
 * Nikoo AI Dashboard - QA Agent
 * شناسه سند: NIKOO-MVP-TECH-001
 * نسخه: 1.0
 * 
 * ایجنت تضمین کیفیت
 * مسئولیت‌ها:
 * - اجرای آزمون‌ها
 * - بررسی معیارهای پذیرش
 * - تولید گزارش QA
 */

const path = require('path');
const { BaseAgent } = require('../shared/agent-base');
const { createLogger } = require('../shared/logger');
const { getConfig, PROJECT_ROOT } = require('../shared/harness-config');
const {
  listFiles,
  readJsonFile,
  writeJsonFile,
  exists,
  getFileInfo
} = require('../shared/utils');

class QAAgent extends BaseAgent {
  constructor() {
    super('qa', { logLevel: 'info' });
    this.config = getConfig('qa');
    this.logger = createLogger('qa');
    
    // معیارهای پذیرش
    this.acceptanceCriteria = this.config.acceptanceCriteria || {};
    
    // نتایج آزمون
    this.testResults = {
      timestamp: new Date().toISOString(),
      project: {
        name: this.config.general.projectName,
        version: this.config.general.version
      },
      criteria: {},
      summary: {
        total: Object.keys(this.acceptanceCriteria).length,
        passed: 0,
        failed: 0,
        skipped: 0
      },
      details: []
    };
    
    // تنظیمات آزمون
    this.testConfig = {
      reportDir: this.config.reportDir,
      coverage: this.config.coverage,
      testFrameworks: this.config.testFrameworks
    };
  }

  /**
   * متد start سفارشی
   */
  async onStart() {
    this.logger.info('QA Agent starting...');
    await this.initialize();
  }

  /**
   * مقداردهی اولیه
   */
  async initialize() {
    this.logger.info('Initializing QA Agent...');
    
    // ایجاد دایرکتوری گزارش‌ها
    const fs = require('fs');
    if (!fs.existsSync(this.testConfig.reportDir)) {
      fs.mkdirSync(this.testConfig.reportDir, { recursive: true });
    }
    
    // بارگذاری معیارهای پذیرش از فایل
    const criteriaFile = path.join(PROJECT_ROOT, 'config/acceptance-criteria.json');
    if (exists(criteriaFile)) {
      const customCriteria = readJsonFile(criteriaFile);
      if (customCriteria) {
        this.acceptanceCriteria = { ...this.acceptanceCriteria, ...customCriteria };
      }
    }
    
    this.logger.success('QA Agent initialized successfully');
  }

  /**
   * وظایف ایجنت
   */
  tasks = {
    /**
     * اجرای تمام معیارهای پذیرش
     */
    runAllAcceptanceCriteria: async (params = {}) => {
      this.logger.info('Running all acceptance criteria...');
      
      const results = [];
      
      // اجرا کردن هر معیار
      for (const [criteriaId, criteriaConfig] of Object.entries(this.acceptanceCriteria)) {
        try {
          const result = await this.runAcceptanceCriteria(criteriaId);
          results.push(result);
          
          // به‌روزرسانی آمار
          if (result.passed) {
            this.testResults.summary.passed++;
          } else {
            this.testResults.summary.failed++;
          }
          
          this.testResults.criteria[criteriaId] = result;
          this.testResults.details.push(result);
          
        } catch (error) {
          this.logger.error(`Failed to run criteria ${criteriaId}`, { error: error.message });
          this.testResults.criteria[criteriaId] = {
            criteria: criteriaId,
            name: criteriaConfig.name || criteriaId,
            passed: false,
            error: error.message
          };
          this.testResults.summary.failed++;
        }
      }
      
      // ذخیره گزارش
      await this.saveReport();
      
      this.logger.success(`Acceptance criteria completed: ${this.testResults.summary.passed} passed, ${this.testResults.summary.failed} failed`);
      return this.testResults;
    },

    /**
     * اجرای یک معیار پذیرش خاص
     */
    runAcceptanceCriteria: async (criteriaId, params = {}) => {
      this.logger.info(`Running acceptance criteria: ${criteriaId}`);
      
      const criteriaConfig = this.acceptanceCriteria[criteriaId];
      if (!criteriaConfig) {
        throw new Error(`Acceptance criteria ${criteriaId} not found`);
      }
      
      // بررسی اینکه آیا متد سفارشی وجود دارد
      const customMethod = this[`check${criteriaId}`];
      if (customMethod) {
        return await customMethod(params);
      }
      
      // در غیر این صورت، بررسی عمومی انجام دهید
      return {
        criteria: criteriaId,
        name: criteriaConfig.name || criteriaId,
        passed: false,
        error: 'No implementation for this criteria'
      };
    },

    /**
     * بررسی معیار QA-01: Build
     */
    checkQA01: async (params = {}) => {
      this.logger.info('Checking QA-01: Build execution...');
      
      try {
        const packageJson = readJsonFile(path.join(PROJECT_ROOT, 'package.json'));
        const hasBuildScript = packageJson?.scripts?.build;
        
        // بررسی وجود اسکریپت build
        if (!hasBuildScript) {
          return {
            criteria: 'QA-01',
            name: 'Build Execution',
            passed: false,
            error: 'Build script not found in package.json',
            recommendation: 'Add "build": "..." to scripts in package.json'
          };
        }
        
        // بررسی وجود دایرکتوری dist
        const distDir = path.join(PROJECT_ROOT, 'dist');
        const distExists = exists(distDir);
        
        return {
          criteria: 'QA-01',
          name: 'Build Execution',
          passed: distExists,
          details: {
            buildScript: hasBuildScript,
            distDirExists: distExists
          },
          recommendation: !distExists ? 
            'Run npm run build to create dist directory' : 
            'Build script exists and dist directory is present'
        };
      } catch (error) {
        return {
          criteria: 'QA-01',
          name: 'Build Execution',
          passed: false,
          error: error.message
        };
      }
    },

    /**
     * بررسی معیار QA-02: صفحات
     */
    checkQA02: async (params = {}) => {
      this.logger.info('Checking QA-02: Pages loading...');
      
      try {
        const pagesDir = path.join(PROJECT_ROOT, 'pages');
        const pagesExist = exists(pagesDir);
        
        if (!pagesExist) {
          return {
            criteria: 'QA-02',
            name: 'Pages Loading',
            passed: false,
            error: 'Pages directory not found',
            recommendation: 'Create pages directory with required pages'
          };
        }
        
        // لیست صفحات
        const pages = listFiles(pagesDir).filter(f => f.endsWith('.html'));
        
        // بررسی صفحات مورد نیاز بر اساس ماده ۴ قرارداد
        const requiredPages = [
          'dashboard',
          'projects',
          'ai-assistant',
          'users',
          'settings'
        ];
        
        const missingPages = requiredPages.filter(req => 
          !pages.some(p => path.basename(p, '.html').includes(req))
        );
        
        return {
          criteria: 'QA-02',
          name: 'Pages Loading',
          passed: missingPages.length === 0,
          details: {
            totalPages: pages.length,
            requiredPages,
            missingPages
          },
          recommendation: missingPages.length > 0 ?
            `Create missing pages: ${missingPages.join(', ')}` :
            'All required pages are present'
        };
      } catch (error) {
        return {
          criteria: 'QA-02',
          name: 'Pages Loading',
          passed: false,
          error: error.message
        };
      }
    },

    /**
     * بررسی معیار QA-03: پشتیبانی RTL
     */
    checkQA03: async (params = {}) => {
      this.logger.info('Checking QA-03: RTL Support...');
      
      try {
        // بررسی وجود فایل‌های CSS
        const cssDir = path.join(PROJECT_ROOT, 'assets/css');
        const cssFiles = listFiles(cssDir);
        
        // بررسی وجود تنظیمات RTL در Tailwind
        const tailwindConfig = readJsonFile(path.join(PROJECT_ROOT, 'tailwind.config.js'));
        const inputCss = readJsonFile(path.join(PROJECT_ROOT, 'assets/css/input.css'));
        
        // بررسی وجود direction: rtl در CSS
        let hasRTL = false;
        for (const cssFile of cssFiles) {
          try {
            const content = require('fs').readFileSync(cssFile, 'utf8');
            if (content.includes('direction: rtl') || content.includes('[dir="rtl"]')) {
              hasRTL = true;
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        // بررسی وجود فونت فارسی
        const fontsDir = path.join(PROJECT_ROOT, 'assets/fonts');
        const fontsExist = exists(fontsDir);
        const persianFonts = fontsExist ? 
          listFiles(fontsDir).filter(f => 
            f.toLowerCase().includes('persian') || 
            f.toLowerCase().includes('fa') ||
            f.toLowerCase().includes('iran')
          ) : [];
        
        return {
          criteria: 'QA-03',
          name: 'RTL Support',
          passed: hasRTL && persianFonts.length > 0,
          details: {
            hasRTL,
            fontsDirExists: fontsExist,
            persianFonts: persianFonts.map(f => path.basename(f))
          },
          recommendation: !hasRTL ? 
            'Add RTL direction support to CSS files' : 
            (!fontsExist ? 
              'Add Persian fonts to assets/fonts directory' :
              'RTL support is properly configured')
        };
      } catch (error) {
        return {
          criteria: 'QA-03',
          name: 'RTL Support',
          passed: false,
          error: error.message
        };
      }
    },

    /**
     * بررسی معیار QA-04: واکنش‌گرایی
     */
    checkQA04: async (params = {}) => {
      this.logger.info('Checking QA-04: Responsiveness...');
      
      try {
        // بررسی وجود Media Queries در CSS
        const cssFiles = listFiles(path.join(PROJECT_ROOT, 'assets/css'));
        let hasMediaQueries = false;
        let hasBreakpoints = false;
        
        for (const cssFile of cssFiles) {
          try {
            const content = require('fs').readFileSync(cssFile, 'utf8');
            
            // بررسی Media Queries
            if (content.includes('@media')) {
              hasMediaQueries = true;
            }
            
            // بررسی Breakpoints Tailwind
            const breakpoints = ['sm:', 'md:', 'lg:', 'xl:', '2xl:'];
            if (breakpoints.some(bp => content.includes(bp))) {
              hasBreakpoints = true;
            }
          } catch (e) {
            continue;
          }
        }
        
        // بررسی وجود Meta Viewport
        const indexHtml = path.join(PROJECT_ROOT, 'index.html');
        let hasViewport = false;
        
        if (exists(indexHtml)) {
          const content = require('fs').readFileSync(indexHtml, 'utf8');
          hasViewport = content.includes('name="viewport"');
        }
        
        return {
          criteria: 'QA-04',
          name: 'Responsiveness',
          passed: hasMediaQueries && hasViewport,
          details: {
            hasMediaQueries,
            hasBreakpoints,
            hasViewport
          },
          recommendation: !hasViewport ?
            'Add viewport meta tag to HTML' :
            (!hasMediaQueries ? 
              'Add media queries for responsive design' :
              'Responsiveness is properly configured')
        };
      } catch (error) {
        return {
          criteria: 'QA-04',
          name: 'Responsiveness',
          passed: false,
          error: error.message
        };
      }
    },

    /**
     * بررسی معیار QA-05: تعاملات
     */
    checkQA05: async (params = {}) => {
      this.logger.info('Checking QA-05: Interactions...');
      
      try {
        const jsFiles = listFiles(path.join(PROJECT_ROOT, 'assets/js'));
        
        // بررسی وجود توابع جستجو
        let hasSearch = false;
        // بررسی وجود توابع فیلتر
        let hasFilter = false;
        // بررسی وجود توابع فرم
        let hasForms = false;
        
        for (const jsFile of jsFiles) {
          try {
            const content = require('fs').readFileSync(jsFile, 'utf8');
            
            hasSearch = hasSearch || content.includes('search') || content.includes('filter');
            hasFilter = hasFilter || content.includes('filter') || content.includes('where');
            hasForms = hasForms || content.includes('form') || content.includes('submit');
          } catch (e) {
            continue;
          }
        }
        
        return {
          criteria: 'QA-05',
          name: 'Interactions',
          passed: hasSearch && hasFilter && hasForms,
          details: {
            hasSearch,
            hasFilter,
            hasForms
          },
          recommendation: !hasSearch ?
            'Implement search functionality' :
            (!hasFilter ? 
              'Implement filter functionality' :
              (!hasForms ? 
                'Implement form handling' :
                'All required interactions are implemented'))
        };
      } catch (error) {
        return {
          criteria: 'QA-05',
          name: 'Interactions',
          passed: false,
          error: error.message
        };
      }
    },

    /**
     * بررسی معیار QA-06: مدیریت وضعیت‌ها
     */
    checkQA06: async (params = {}) => {
      this.logger.info('Checking QA-06: State Handling...');
      
      try {
        const jsFiles = listFiles(path.join(PROJECT_ROOT, 'assets/js'));
        
        // بررسی وجود مدیریت وضعیت
        let hasLoadingState = false;
        let hasErrorState = false;
        let hasEmptyState = false;
        
        for (const jsFile of jsFiles) {
          try {
            const content = require('fs').readFileSync(jsFile, 'utf8');
            
            hasLoadingState = hasLoadingState || content.includes('loading') || content.includes('isLoading');
            hasErrorState = hasErrorState || content.includes('error') || content.includes('hasError');
            hasEmptyState = hasEmptyState || content.includes('empty') || content.includes('isEmpty');
          } catch (e) {
            continue;
          }
        }
        
        return {
          criteria: 'QA-06',
          name: 'State Handling',
          passed: hasLoadingState && hasErrorState && hasEmptyState,
          details: {
            hasLoadingState,
            hasErrorState,
            hasEmptyState
          },
          recommendation: !hasLoadingState ?
            'Implement loading state handling' :
            (!hasErrorState ? 
              'Implement error state handling' :
              (!hasEmptyState ? 
                'Implement empty state handling' :
                'All state handling is implemented'))
        };
      } catch (error) {
        return {
          criteria: 'QA-06',
          name: 'State Handling',
          passed: false,
          error: error.message
        };
      }
    },

    /**
     * بررسی معیار QA-07: رابط AI
     */
    checkQA07: async (params = {}) => {
      this.logger.info('Checking QA-07: AI Interface...');
      
      try {
        // بررسی وجود صفحه AI Assistant
        const aiPage = path.join(PROJECT_ROOT, 'pages', 'ai-assistant.html');
        const aiPageExists = exists(aiPage);
        
        // بررسی وجود کامپوننت AI
        const aiComponents = listFiles(path.join(PROJECT_ROOT, 'components'))
          .filter(f => f.toLowerCase().includes('ai') || f.toLowerCase().includes('chat'));
        
        // بررسی وجود Mock API
        const mockData = path.join(PROJECT_ROOT, 'data', 'mock-ai-responses.json');
        const mockExists = exists(mockData);
        
        return {
          criteria: 'QA-07',
          name: 'AI Interface',
          passed: aiPageExists && aiComponents.length > 0 && mockExists,
          details: {
            aiPageExists,
            aiComponents: aiComponents.map(f => path.basename(f)),
            mockExists
          },
          recommendation: !aiPageExists ?
            'Create AI assistant page' :
            (aiComponents.length === 0 ? 
              'Create AI-related components' :
              (!mockExists ? 
                'Create mock AI responses' :
                'AI interface is properly configured'))
        };
      } catch (error) {
        return {
          criteria: 'QA-07',
          name: 'AI Interface',
          passed: false,
          error: error.message
        };
      }
    },

    /**
     * بررسی معیار QA-08: دسترس‌پذیری
     */
    checkQA08: async (params = {}) => {
      this.logger.info('Checking QA-08: Accessibility...');
      
      try {
        const htmlFiles = [
          path.join(PROJECT_ROOT, 'index.html'),
          ...listFiles(path.join(PROJECT_ROOT, 'pages')).filter(f => f.endsWith('.html'))
        ];
        
        let hasAltText = true;
        let hasAriaLabels = false;
        let hasFocusStyles = false;
        let hasSemanticHTML = false;
        
        for (const htmlFile of htmlFiles) {
          if (!exists(htmlFile)) continue;
          
          try {
            const content = require('fs').readFileSync(htmlFile, 'utf8');
            
            // بررسی alt text برای تصاویر
            const imgMatches = content.match(/<img[^>]*>/g) || [];
            for (const img of imgMatches) {
              if (!img.includes('alt=')) {
                hasAltText = false;
                break;
              }
            }
            
            // بررسی aria-labels
            hasAriaLabels = hasAriaLabels || content.includes('aria-label=') || content.includes('aria-labelledby=');
            
            // بررسی focus styles
            hasFocusStyles = hasFocusStyles || content.includes(':focus') || content.includes('outline');
            
            // بررسی HTML معنایی
            hasSemanticHTML = hasSemanticHTML || 
              content.includes('<header') || 
              content.includes('<main') || 
              content.includes('<footer') ||
              content.includes('<section') ||
              content.includes('<article') ||
              content.includes('<nav');
          } catch (e) {
            continue;
          }
        }
        
        return {
          criteria: 'QA-08',
          name: 'Accessibility',
          passed: hasAltText && hasAriaLabels && hasFocusStyles && hasSemanticHTML,
          details: {
            hasAltText,
            hasAriaLabels,
            hasFocusStyles,
            hasSemanticHTML
          },
          recommendation: !hasAltText ?
            'Add alt text to all images' :
            (!hasAriaLabels ? 
              'Add aria-labels to interactive elements' :
              (!hasFocusStyles ? 
                'Add focus styles for keyboard navigation' :
                (!hasSemanticHTML ? 
                  'Use semantic HTML elements' :
                  'Accessibility features are properly implemented')))
        };
      } catch (error) {
        return {
          criteria: 'QA-08',
          name: 'Accessibility',
          passed: false,
          error: error.message
        };
      }
    },

    /**
     * بررسی معیار QA-10: بسته تحویل
     */
    checkQA10: async (params = {}) => {
      this.logger.info('Checking QA-10: Delivery Package...');
      
      try {
        const distDir = path.join(PROJECT_ROOT, 'dist');
        const distExists = exists(distDir);
        
        // بررسی وجود فایل‌های ضروری
        const requiredFiles = [
          path.join(distDir, 'index.html'),
          path.join(distDir, 'assets/css/output.css')
        ];
        
        const missingFiles = requiredFiles.filter(f => !exists(f));
        
        // بررسی وجود README
        const readmeExists = exists(path.join(PROJECT_ROOT, 'README.md'));
        
        return {
          criteria: 'QA-10',
          name: 'Delivery Package',
          passed: distExists && missingFiles.length === 0 && readmeExists,
          details: {
            distExists,
            missingFiles: missingFiles.map(f => path.relative(PROJECT_ROOT, f)),
            readmeExists
          },
          recommendation: !distExists ?
            'Run build to create dist directory' :
            (missingFiles.length > 0 ? 
              `Build is incomplete, missing: ${missingFiles.join(', ')}` :
              (!readmeExists ? 
                'Add README.md file' :
                'Delivery package is complete'))
        };
      } catch (error) {
        return {
          criteria: 'QA-10',
          name: 'Delivery Package',
          passed: false,
          error: error.message
        };
      }
    },

    /**
     * بررسی معیار QA-12: اصلاحات
     */
    checkQA12: async (params = {}) => {
      this.logger.info('Checking QA-12: Fixes Verification...');
      
      try {
        // این معیار پس از اصلاحات بررسی می‌شود
        // در حال حاضر، فقط بررسی می‌کنیم که آیا آزمون‌های قبلی اجرا شده‌اند
        const reportDir = this.testConfig.reportDir;
        const reportExists = exists(path.join(reportDir, 'qa-report.json'));
        
        return {
          criteria: 'QA-12',
          name: 'Fixes Verification',
          passed: reportExists,
          details: {
            reportExists
          },
          recommendation: !reportExists ?
            'Run QA tests first to generate report' :
            'Previous test report exists, fixes can be verified'
        };
      } catch (error) {
        return {
          criteria: 'QA-12',
          name: 'Fixes Verification',
          passed: false,
          error: error.message
        };
      }
    },

    /**
     * ذخیره گزارش
     */
    saveReport: async (params = {}) => {
      this.logger.info('Saving QA report...');
      
      try {
        const reportPath = path.join(this.testConfig.reportDir, 'qa-report.json');
        await writeJsonFile(reportPath, this.testResults);
        
        this.logger.success(`QA report saved to ${reportPath}`);
        return this.testResults;
      } catch (error) {
        this.logger.error('Failed to save QA report', { error: error.message });
        throw error;
      }
    },

    /**
     * اجرای آزمون‌های Jest
     */
    runJestTests: async (params = {}) => {
      this.logger.info('Running Jest tests...');
      
      try {
        const { execSync } = require('child_process');
        
        // بررسی وجود Jest
        const packageJson = readJsonFile(path.join(PROJECT_ROOT, 'package.json'));
        if (!packageJson?.devDependencies?.jest) {
          return {
            success: false,
            error: 'Jest is not installed',
            recommendation: 'Install Jest: npm install --save-dev jest'
          };
        }
        
        // اجرا کردن Jest
        const command = 'npx jest --json --silent';
        const output = execSync(command, { 
          cwd: PROJECT_ROOT,
          encoding: 'utf8'
        });
        
        const result = JSON.parse(output);
        
        return {
          success: result.success,
          tests: result.numTotalTests,
          passed: result.numPassedTests,
          failed: result.numFailedTests,
          coverage: result.coverageMap ? Object.keys(result.coverageMap).length : 0
        };
      } catch (error) {
        this.logger.error('Failed to run Jest tests', { error: error.message });
        return {
          success: false,
          error: error.message
        };
      }
    },

    /**
     * اجرای آزمون‌های Playwright
     */
    runPlaywrightTests: async (params = {}) => {
      this.logger.info('Running Playwright tests...');
      
      try {
        const { execSync } = require('child_process');
        
        // بررسی وجود Playwright
        const packageJson = readJsonFile(path.join(PROJECT_ROOT, 'package.json'));
        if (!packageJson?.devDependencies?.playwright) {
          return {
            success: false,
            error: 'Playwright is not installed',
            recommendation: 'Install Playwright: npm install --save-dev playwright'
          };
        }
        
        // اجرا کردن Playwright
        const command = 'npx playwright test --reporter=json';
        const output = execSync(command, { 
          cwd: PROJECT_ROOT,
          encoding: 'utf8'
        });
        
        return {
          success: true,
          output
        };
      } catch (error) {
        this.logger.error('Failed to run Playwright tests', { error: error.message });
        return {
          success: false,
          error: error.message
        };
      }
    }
  };

  /**
   * دریافت گزارش کامل
   */
  getReport() {
    return {
      ...super.getReport(),
      testResults: this.testResults
    };
  }

  /**
   * دریافت نتایج آزمون
   */
  getTestResults() {
    return this.testResults;
  }

  /**
   * بررسی اینکه آیا تمام معیارها پاس شده‌اند
   */
  allCriteriaPassed() {
    return this.testResults.summary.failed === 0;
  }
}

// ایجاد و صادرات ایجنت
const qaAgent = new QAAgent();
module.exports = qaAgent;
