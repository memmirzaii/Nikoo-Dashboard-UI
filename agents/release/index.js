/**
 * Nikoo AI Dashboard - Release Agent
 * شناسه سند: NIKOO-MVP-TECH-001
 * نسخه: 1.0
 * 
 * ایجنت بسته‌بندی و انتشار
 * مسئولیت‌ها:
 * - بسته‌بندی کد منبع
 * - تولید خروجی Build
 * - ایجاد فایل ZIP
 * - تولید مستندات تحویل
 */

const path = require('path');
const fs = require('fs');
const { BaseAgent } = require('../shared/agent-base');
const { createLogger } = require('../shared/logger');
const { getConfig, PROJECT_ROOT } = require('../shared/harness-config');
const { 
  listFiles, 
  readJsonFile, 
  writeJsonFile, 
  exists, 
  copy,
  remove 
} = require('../shared/utils');

class ReleaseAgent extends BaseAgent {
  constructor() {
    super('release', { logLevel: 'info' });
    this.config = getConfig('release');
    this.logger = createLogger('release');
    
    // تنظیمات بسته‌بندی
    this.packageConfig = {
      outputDir: this.config.outputDir,
      zipFile: this.config.zipFile,
      includeFiles: this.config.includeFiles || [],
      excludeFiles: this.config.excludeFiles || [],
      packageName: this.config.packageName,
      version: this.config.general.version
    };
    
    // اطلاعات بسته
    this.packageInfo = {
      timestamp: null,
      files: [],
      size: 0,
      checksum: null
    };
  }

  /**
   * متد start سفارشی
   */
  async onStart() {
    this.logger.info('Release Agent starting...');
    await this.initialize();
  }

  /**
   * مقداردهی اولیه
   */
  async initialize() {
    this.logger.info('Initializing Release Agent...');
    
    // ایجاد دایرکتوری خروجی
    if (!fs.existsSync(this.packageConfig.outputDir)) {
      fs.mkdirSync(this.packageConfig.outputDir, { recursive: true });
    }
    
    // ایجاد دایرکتوری releases
    const releasesDir = path.dirname(this.packageConfig.zipFile);
    if (!fs.existsSync(releasesDir)) {
      fs.mkdirSync(releasesDir, { recursive: true });
    }
    
    this.logger.success('Release Agent initialized successfully');
  }

  /**
   * وظایف ایجنت
   */
  tasks = {
    /**
     * ایجاد بسته تحویل
     */
    createPackage: async (params = {}) => {
      this.logger.info('Creating delivery package...');
      
      try {
        // مرحله 1: Build پروژه
        await this.buildProject();
        
        // مرحله 2: کپی فایل‌ها
        await this.copyFiles();
        
        // مرحله 3: ایجاد فایل ZIP
        await this.createZipFile();
        
        // مرحله 4: محاسبه checksum
        await this.calculateChecksum();
        
        // مرحله 5: تولید مستندات
        await this.generateDocumentation();
        
        this.logger.success('Delivery package created successfully');
        return this.packageInfo;
      } catch (error) {
        this.logger.error('Failed to create delivery package', { error: error.message });
        throw error;
      }
    },

    /**
     * Build پروژه
     */
    buildProject: async (params = {}) => {
      this.logger.info('Building project...');
      
      try {
        const packageJson = readJsonFile(path.join(PROJECT_ROOT, 'package.json'));
        
        if (!packageJson?.scripts?.build) {
          this.logger.warn('No build script found, skipping build');
          return { success: true, message: 'No build script found' };
        }
        
        // اجرا کردن build
        const { execSync } = require('child_process');
        const command = 'npm run build';
        
        this.logger.info(`Running: ${command}`);
        
        execSync(command, { 
          cwd: PROJECT_ROOT,
          stdio: 'inherit'
        });
        
        this.logger.success('Project built successfully');
        return { success: true, message: 'Build completed' };
      } catch (error) {
        this.logger.error('Build failed', { error: error.message });
        return { success: false, error: error.message };
      }
    },

    /**
     * کپی فایل‌ها به دایرکتوری خروجی
     */
    copyFiles: async (params = {}) => {
      this.logger.info('Copying files to output directory...');
      
      try {
        // پاک کردن دایرکتوری خروجی
        if (fs.existsSync(this.packageConfig.outputDir)) {
          remove(this.packageConfig.outputDir);
        }
        fs.mkdirSync(this.packageConfig.outputDir, { recursive: true });
        
        // کپی فایل‌های مورد نیاز
        const filesToCopy = [];
        
        // کپی دایرکتوری dist
        const distDir = path.join(PROJECT_ROOT, 'dist');
        if (exists(distDir)) {
          copy(distDir, path.join(this.packageConfig.outputDir, 'dist'));
          filesToCopy.push('dist/**');
        }
        
        // کپی فایل‌های خاص
        const specificFiles = [
          'package.json',
          'README.md',
          'LICENSE',
          'index.html'
        ];
        
        for (const file of specificFiles) {
          const filePath = path.join(PROJECT_ROOT, file);
          if (exists(filePath)) {
            copy(filePath, path.join(this.packageConfig.outputDir, file));
            filesToCopy.push(file);
          }
        }
        
        // کپی پوشه‌های خاص
        const specificDirs = ['docs', 'config'];
        for (const dir of specificDirs) {
          const dirPath = path.join(PROJECT_ROOT, dir);
          if (exists(dirPath)) {
            copy(dirPath, path.join(this.packageConfig.outputDir, dir));
            filesToCopy.push(`${dir}/**`);
          }
        }
        
        // لیست فایل‌های کپی شده
        this.packageInfo.files = listFiles(this.packageConfig.outputDir, { recursive: true });
        
        // محاسبه اندازه
        let totalSize = 0;
        for (const file of this.packageInfo.files) {
          try {
            const stats = fs.statSync(file);
            totalSize += stats.size;
          } catch (e) {
            continue;
          }
        }
        this.packageInfo.size = totalSize;
        
        this.logger.success(`Copied ${this.packageInfo.files.length} files (${this.formatSize(totalSize)})`);
        return { success: true, files: this.packageInfo.files };
      } catch (error) {
        this.logger.error('Failed to copy files', { error: error.message });
        throw error;
      }
    },

    /**
     * ایجاد فایل ZIP
     */
    createZipFile: async (params = {}) => {
      this.logger.info('Creating ZIP file...');
      
      try {
        const archiver = require('archiver');
        
        // ایجاد فایل ZIP
        const output = fs.createWriteStream(this.packageConfig.zipFile);
        const archive = archiver('zip', {
          zlib: { level: 9 } // حداکثر فشرده‌سازی
        });
        
        // پیوند خروجی
        archive.pipe(output);
        
        // اضافه کردن فایل‌ها
        for (const file of this.packageInfo.files) {
          const relativePath = path.relative(this.packageConfig.outputDir, file);
          archive.file(file, { name: relativePath });
        }
        
        // نهایی‌سازی
        await archive.finalize();
        
        this.packageInfo.timestamp = timestamp();
        
        this.logger.success(`ZIP file created: ${this.packageConfig.zipFile}`);
        return { success: true, path: this.packageConfig.zipFile };
      } catch (error) {
        this.logger.error('Failed to create ZIP file', { error: error.message });
        throw error;
      }
    },

    /**
     * محاسبه checksum
     */
    calculateChecksum: async (params = {}) => {
      this.logger.info('Calculating checksum...');
      
      try {
        const crypto = require('crypto');
        const fs = require('fs');
        
        const fileBuffer = fs.readFileSync(this.packageConfig.zipFile);
        const hash = crypto.createHash('sha256');
        hash.update(fileBuffer);
        
        this.packageInfo.checksum = hash.digest('hex');
        
        this.logger.success(`Checksum calculated: ${this.packageInfo.checksum}`);
        return { success: true, checksum: this.packageInfo.checksum };
      } catch (error) {
        this.logger.error('Failed to calculate checksum', { error: error.message });
        throw error;
      }
    },

    /**
     * تولید مستندات
     */
    generateDocumentation: async (params = {}) => {
      this.logger.info('Generating documentation...');
      
      try {
        // ایجاد فایل README برای بسته
        const packageReadme = path.join(path.dirname(this.packageConfig.zipFile), 'README.md');
        
        const readmeContent = `# Nikoo AI Dashboard - Delivery Package

**Version:** ${this.packageConfig.version}  
**Date:** ${new Date().toLocaleDateString('fa-IR')}  
**Package Name:** ${this.packageConfig.packageName}

## 📋 Package Contents

- **Total Files:** ${this.packageInfo.files.length}
- **Total Size:** ${this.formatSize(this.packageInfo.size)}
- **Checksum (SHA-256):** ${this.packageInfo.checksum}

## 📁 Structure

"`;
        
        // اضافه کردن ساختار پوشه‌ها
        const distDir = path.join(this.packageConfig.outputDir, 'dist');
        if (exists(distDir)) {
          const distFiles = listFiles(distDir, { recursive: true });
          readmeContent += `dist/\n`;
          
          for (const file of distFiles) {
            const relativePath = path.relative(distDir, file);
            readmeContent += `  - ${relativePath}\n`;
          }
        }
        
        readmeContent += `"\n\n## 🚀 Installation\n\n`;
        readmeContent += `1. Extract the ZIP file\n`;
        readmeContent += `2. Navigate to the extracted directory\n`;
        readmeContent += `3. Run "`;
        readmeContent += `npm install\n`;
        readmeContent += `4. Run "`;
        readmeContent += `npm run dev\n`;
        readmeContent += `\n\n## 📝 Notes\n\n`;
        readmeContent += `- This is a MVP version\n`;
        readmeContent += `- AI interface uses mock data\n`;
        readmeContent += `- For production use, connect to real AI API\n`;
        
        writeJsonFile(packageReadme, readmeContent);
        
        this.logger.success('Documentation generated successfully');
        return { success: true, path: packageReadme };
      } catch (error) {
        this.logger.error('Failed to generate documentation', { error: error.message });
        throw error;
      }
    },

    /**
     * بررسی معیار QA-10: بسته تحویل
     */
    checkQA10: async (params = {}) => {
      this.logger.info('Checking QA-10: Delivery Package...');
      
      try {
        // بررسی وجود فایل ZIP
        const zipExists = exists(this.packageConfig.zipFile);
        
        if (!zipExists) {
          return {
            criteria: 'QA-10',
            name: 'Delivery Package',
            passed: false,
            error: 'ZIP file not found',
            recommendation: 'Run createPackage task to generate ZIP file'
          };
        }
        
        // بررسی اندازه فایل
        const stats = fs.statSync(this.packageConfig.zipFile);
        const size = stats.size;
        
        // بررسی checksum
        const hasChecksum = this.packageInfo.checksum !== null;
        
        return {
          criteria: 'QA-10',
          name: 'Delivery Package',
          passed: zipExists && hasChecksum,
          details: {
            zipExists,
            size: this.formatSize(size),
            hasChecksum,
            checksum: this.packageInfo.checksum
          },
          recommendation: !zipExists ?
            'Create delivery package first' :
            (!hasChecksum ? 
              'Checksum not calculated' :
              'Delivery package is valid')
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
     * استخراج بسته در محیط پاک
     */
    extractInCleanEnvironment: async (params = {}) => {
      this.logger.info('Extracting package in clean environment...');
      
      try {
        const { execSync } = require('child_process');
        
        // ایجاد یک دایرکتوری موقت
        const tempDir = path.join(PROJECT_ROOT, '.harness-temp', 'clean-env');
        if (fs.existsSync(tempDir)) {
          remove(tempDir);
        }
        fs.mkdirSync(tempDir, { recursive: true });
        
        // استخراج فایل ZIP
        const command = `unzip ${this.packageConfig.zipFile} -d ${tempDir}`;
        
        this.logger.info(`Running: ${command}`);
        
        execSync(command, { 
          cwd: PROJECT_ROOT,
          stdio: 'inherit'
        });
        
        // بررسی اینکه آیا استخراج موفق بوده است
        const extractedFiles = listFiles(tempDir, { recursive: true });
        
        this.logger.success(`Package extracted successfully to ${tempDir}`);
        return {
          success: true,
          path: tempDir,
          files: extractedFiles
        };
      } catch (error) {
        this.logger.error('Failed to extract package', { error: error.message });
        return {
          success: false,
          error: error.message
        };
      }
    },

    /**
     * تست اجرا در محیط پاک
     */
    testInCleanEnvironment: async (params = {}) => {
      this.logger.info('Testing package in clean environment...');
      
      try {
        // استخراج در محیط پاک
        const extractResult = await this.extractInCleanEnvironment();
        
        if (!extractResult.success) {
          return extractResult;
        }
        
        // بررسی فایل‌های ضروری
        const requiredFiles = [
          path.join(extractResult.path, 'index.html'),
          path.join(extractResult.path, 'dist/index.html'),
          path.join(extractResult.path, 'package.json')
        ];
        
        const missingFiles = [];
        for (const file of requiredFiles) {
          if (!exists(file)) {
            missingFiles.push(path.relative(extractResult.path, file));
          }
        }
        
        if (missingFiles.length > 0) {
          return {
            success: false,
            error: `Missing files in extracted package: ${missingFiles.join(', ')}`,
            missingFiles
          };
        }
        
        // بررسی اینکه آیا می‌توان package.json را خواند
        const packageJsonPath = path.join(extractResult.path, 'package.json');
        const packageJson = readJsonFile(packageJsonPath);
        
        if (!packageJson) {
          return {
            success: false,
            error: 'package.json is invalid or missing'
          };
        }
        
        this.logger.success('Package tested successfully in clean environment');
        return {
          success: true,
          message: 'All tests passed in clean environment'
        };
      } catch (error) {
        this.logger.error('Failed to test package', { error: error.message });
        return {
          success: false,
          error: error.message
        };
      }
    }
  };

  /**
   * فرمتی کردن اندازه فایل
   */
  formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * دریافت گزارش کامل
   */
  getReport() {
    return {
      ...super.getReport(),
      packageInfo: this.packageInfo
    };
  }

  /**
   * دریافت اطلاعات بسته
   */
  getPackageInfo() {
    return this.packageInfo;
  }
}

// ایجاد و صادرات ایجنت
const releaseAgent = new ReleaseAgent();
module.exports = releaseAgent;
