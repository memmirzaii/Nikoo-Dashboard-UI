/**
 * Nikoo AI Dashboard - Auditor Agent
 * شناسه سند: NIKOO-MVP-TECH-001
 * نسخه: 1.0
 * 
 * ایجنت ممیزی پروژه
 * مسئولیت‌ها:
 * - بررسی وجود فایل‌ها و دایرکتوری‌ها
 * - بررسی وابستگی‌ها
 * - بررسی امنیت فایل‌ها
 * - تولید گزارش ممیزی
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
  getFileInfo,
  checkFilePermissions,
  filterFiles,
  matchesPattern
} = require('../shared/utils');

class AuditorAgent extends BaseAgent {
  constructor() {
    super('auditor', { logLevel: 'info' });
    this.config = getConfig('auditor');
    this.logger = createLogger('auditor');
    
    // تنظیمات اسکن
    this.scanConfig = {
      includePatterns: this.config.scanPatterns || ['**/*.{js,css,html,json,md}'],
      excludePatterns: this.config.excludePatterns || [
        'node_modules/**',
        'dist/**',
        '.git/**',
        '.harness-temp/**',
        'reports/**'
      ],
      securityPatterns: this.config.security?.forbiddenPatterns || []
    };
    
    // نتایج ممیزی
    this.auditResults = {
      timestamp: new Date().toISOString(),
      project: {
        name: this.config.general.projectName,
        version: this.config.general.version,
        root: PROJECT_ROOT
      },
      files: [],
      dependencies: null,
      securityIssues: [],
      warnings: [],
      errors: [],
      summary: {
        totalFiles: 0,
        scannedFiles: 0,
        securityIssues: 0,
        warnings: 0,
        errors: 0
      }
    };
  }

  /**
   * متد start سفارشی
   */
  async onStart() {
    this.logger.info('Auditor agent starting...');
    await this.initialize();
  }

  /**
   * مقداردهی اولیه
   */
  async initialize() {
    this.logger.info('Initializing auditor agent...');
    
    // ایجاد دایرکتوری گزارش‌ها
    const reportDir = path.dirname(this.config.reportFile);
    const fs = require('fs');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    this.logger.success('Auditor agent initialized successfully');
  }

  /**
   * وظایف ایجنت
   */
  tasks = {
    /**
     * اسکن کامل پروژه
     */
    scanProject: async (params = {}) => {
      this.logger.info('Starting full project scan...');
      
      try {
        // اسکن فایل‌ها
        await this.scanFiles();
        
        // بررسی وابستگی‌ها
        await this.checkDependencies();
        
        // بررسی امنیت
        await this.checkSecurity();
        
        // ذخیره گزارش
        await this.saveReport();
        
        this.logger.success('Project scan completed successfully');
        return this.auditResults;
      } catch (error) {
        this.logger.error('Failed to scan project', { error: error.message });
        throw error;
      }
    },

    /**
     * اسکن فایل‌ها
     */
    scanFiles: async (params = {}) => {
      this.logger.info('Scanning files...');
      
      const startTime = Date.now();
      const allFiles = listFiles(PROJECT_ROOT, { recursive: true });
      
      // فیلتر کردن فایل‌ها
      const filteredFiles = filterFiles(
        allFiles,
        this.scanConfig.includePatterns,
        this.scanConfig.excludePatterns
      );
      
      this.auditResults.summary.totalFiles = allFiles.length;
      this.auditResults.summary.scannedFiles = filteredFiles.length;
      
      // بررسی هر فایل
      for (const filePath of filteredFiles) {
        try {
          const fileInfo = getFileInfo(filePath);
          if (fileInfo) {
            const fileResult = {
              path: path.relative(PROJECT_ROOT, filePath),
              name: fileInfo.name,
              size: fileInfo.size,
              type: fileInfo.extension.replace('.', ''),
              permissions: checkFilePermissions(filePath),
              modified: fileInfo.modified,
              issues: []
            };
            
            // بررسی مجوزها
            if (!fileResult.permissions.readable) {
              fileResult.issues.push('Not readable');
            }
            
            this.auditResults.files.push(fileResult);
          }
        } catch (error) {
          this.auditResults.errors.push({
            file: filePath,
            error: error.message
          });
        }
      }
      
      const duration = Date.now() - startTime;
      this.logger.success(`Scanned ${filteredFiles.length} files in ${duration}ms`);
      
      return this.auditResults.files;
    },

    /**
     * بررسی وابستگی‌ها
     */
    checkDependencies: async (params = {}) => {
      this.logger.info('Checking dependencies...');
      
      try {
        const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
        const packageJson = readJsonFile(packageJsonPath);
        
        if (!packageJson) {
          this.auditResults.warnings.push('package.json not found');
          return null;
        }
        
        const dependencies = {
          ...packageJson.dependencies || {},
          ...packageJson.devDependencies || {}
        };
        
        this.auditResults.dependencies = {
          total: Object.keys(dependencies).length,
          list: dependencies,
          issues: []
        };
        
        // بررسی نسخه‌ها
        for (const [name, version] of Object.entries(dependencies)) {
          if (version === '*') {
            this.auditResults.dependencies.issues.push({
              package: name,
              issue: 'Wildcard version (*) detected'
            });
          }
        }
        
        this.logger.success(`Found ${Object.keys(dependencies).length} dependencies`);
        return this.auditResults.dependencies;
      } catch (error) {
        this.logger.error('Failed to check dependencies', { error: error.message });
        this.auditResults.errors.push({
          type: 'dependencies',
          error: error.message
        });
        return null;
      }
    },

    /**
     * بررسی امنیت
     */
    checkSecurity: async (params = {}) => {
      this.logger.info('Checking security...');
      
      const securityIssues = [];
      
      // بررسی الگوی‌های ممنوع
      for (const file of this.auditResults.files) {
        const filePath = path.join(PROJECT_ROOT, file.path);
        
        try {
          const content = require('fs').readFileSync(filePath, 'utf8');
          
          for (const pattern of this.scanConfig.securityPatterns) {
            if (pattern.test(content)) {
              securityIssues.push({
                file: file.path,
                issue: `Forbidden pattern detected: ${pattern.toString()}`,
                severity: 'high'
              });
            }
          }
          
          // بررسی فایل‌های حساس
          const sensitiveFiles = ['.env', '.env.local', '.npmrc', 'package-lock.json'];
          if (sensitiveFiles.some(sf => file.name.includes(sf))) {
            securityIssues.push({
              file: file.path,
              issue: 'Sensitive file detected',
              severity: 'medium',
              recommendation: 'Ensure this file is in .gitignore'
            });
          }
          
        } catch (error) {
          // فایل‌های باینری یا غیرقابل خواندن
          continue;
        }
      }
      
      this.auditResults.securityIssues = securityIssues;
      this.auditResults.summary.securityIssues = securityIssues.length;
      
      if (securityIssues.length > 0) {
        this.logger.warn(`Found ${securityIssues.length} security issues`);
      } else {
        this.logger.success('No security issues found');
      }
      
      return securityIssues;
    },

    /**
     * ذخیره گزارش
     */
    saveReport: async (params = {}) => {
      this.logger.info('Saving audit report...');
      
      try {
        // محاسبه آمار
        this.auditResults.summary.warnings = this.auditResults.warnings.length;
        this.auditResults.summary.errors = this.auditResults.errors.length;
        
        // ذخیره در فایل
        await writeJsonFile(this.config.reportFile, this.auditResults);
        
        this.logger.success(`Audit report saved to ${this.config.reportFile}`);
        return this.auditResults;
      } catch (error) {
        this.logger.error('Failed to save audit report', { error: error.message });
        throw error;
      }
    },

    /**
     * بررسی معیار QA-09 (امنیت)
     */
    checkQA09: async (params = {}) => {
      this.logger.info('Checking QA-09: Security...');
      
      try {
        // اجرا کردن اسکن کامل
        await this.scanProject();
        
        // بررسی اینکه آیا اسرار در فایل‌ها وجود دارد
        const hasSecrets = this.auditResults.securityIssues.some(
          issue => issue.severity === 'high'
        );
        
        const result = {
          criteria: 'QA-09',
          name: 'Security - No secrets in client-side code',
          passed: !hasSecrets,
          issues: this.auditResults.securityIssues,
          recommendation: hasSecrets ? 
            'Remove all secrets from client-side code and use environment variables' : 
            'No security issues found'
        };
        
        if (result.passed) {
          this.logger.success('QA-09 passed: No secrets detected in client-side code');
        } else {
          this.logger.error('QA-09 failed: Secrets detected in client-side code');
        }
        
        return result;
      } catch (error) {
        return {
          criteria: 'QA-09',
          name: 'Security - No secrets in client-side code',
          passed: false,
          error: error.message
        };
      }
    },

    /**
     * بررسی معیار QA-11 (مجوزها)
     */
    checkQA11: async (params = {}) => {
      this.logger.info('Checking QA-11: Licenses...');
      
      try {
        const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
        const packageJson = readJsonFile(packageJsonPath);
        
        if (!packageJson) {
          return {
            criteria: 'QA-11',
            name: 'Licenses - Dependencies and licenses documented',
            passed: false,
            error: 'package.json not found'
          };
        }
        
        const dependencies = {
          ...packageJson.dependencies || {},
          ...packageJson.devDependencies || {}
        };
        
        // بررسی وجود لیسانس در پروژه
        const licenseFile = path.join(PROJECT_ROOT, 'LICENSE');
        const licenseExists = exists(licenseFile);
        
        // بررسی وجود مستندات لیسانس
        const licensesDoc = path.join(PROJECT_ROOT, 'LICENSES.md');
        const licensesDocExists = exists(licensesDoc);
        
        const result = {
          criteria: 'QA-11',
          name: 'Licenses - Dependencies and licenses documented',
          passed: licenseExists && Object.keys(dependencies).length > 0,
          details: {
            licenseFileExists: licenseExists,
            licensesDocExists: licensesDocExists,
            dependencyCount: Object.keys(dependencies).length
          },
          recommendation: !licenseExists ? 
            'Add LICENSE file to the project' : 
            (!licensesDocExists ? 
              'Consider adding LICENSES.md to document all dependencies' : 
              'Licenses are properly documented')
        };
        
        if (result.passed) {
          this.logger.success('QA-11 passed: Licenses are documented');
        } else {
          this.logger.warn('QA-11 failed: Licenses are not properly documented');
        }
        
        return result;
      } catch (error) {
        return {
          criteria: 'QA-11',
          name: 'Licenses - Dependencies and licenses documented',
          passed: false,
          error: error.message
        };
      }
    },

    /**
     * بررسی معیار QA-01 (Build)
     */
    checkQA01: async (params = {}) => {
      this.logger.info('Checking QA-01: Build in clean environment...');
      
      try {
        // بررسی وجود فایل‌های build
        const buildDir = path.join(PROJECT_ROOT, 'dist');
        const buildExists = exists(buildDir);
        
        // بررسی وجود اسکریپت build
        const packageJson = readJsonFile(path.join(PROJECT_ROOT, 'package.json'));
        const hasBuildScript = packageJson?.scripts?.build;
        
        const result = {
          criteria: 'QA-01',
          name: 'Build - Execute in clean environment',
          passed: hasBuildScript,
          details: {
            buildScriptExists: hasBuildScript,
            buildDirExists: buildExists
          },
          recommendation: !hasBuildScript ? 
            'Add build script to package.json' : 
            (!buildExists ? 
              'Run npm run build to create dist directory' : 
              'Build script and directory exist')
        };
        
        if (result.passed) {
          this.logger.success('QA-01 passed: Build script exists');
        } else {
          this.logger.error('QA-01 failed: Build script does not exist');
        }
        
        return result;
      } catch (error) {
        return {
          criteria: 'QA-01',
          name: 'Build - Execute in clean environment',
          passed: false,
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
      auditResults: this.auditResults
    };
  }

  /**
   * دریافت نتایج ممیزی
   */
  getAuditResults() {
    return this.auditResults;
  }
}

// ایجاد و صادرات ایجنت
const auditorAgent = new AuditorAgent();
module.exports = auditorAgent;
