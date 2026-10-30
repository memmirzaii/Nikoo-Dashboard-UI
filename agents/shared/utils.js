/**
 * Nikoo AI Dashboard - Agent Harness Utilities
 * شناسه سند: NIKOO-MVP-TECH-001
 * نسخه: 1.0
 * 
 * توابع کمکی مشترک برای تمام ایجنت‌ها
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { PROJECT_ROOT } = require('./harness-config');

/**
 * خواندن فایل JSON
 */
function readJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to read JSON file: ${filePath}. Error: ${error.message}`);
  }
}

/**
 * نوشتن فایل JSON
 */
function writeJsonFile(filePath, data, indent = 2) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const content = JSON.stringify(data, null, indent);
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    throw new Error(`Failed to write JSON file: ${filePath}. Error: ${error.message}`);
  }
}

/**
 * خواندن فایل متنی
 */
function readTextFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read text file: ${filePath}. Error: ${error.message}`);
  }
}

/**
 * نوشتن فایل متنی
 */
function writeTextFile(filePath, content) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    throw new Error(`Failed to write text file: ${filePath}. Error: ${error.message}`);
  }
}

/**
 * بررسی وجود فایل یا دایرکتوری
 */
function exists(path) {
  return fs.existsSync(path);
}

/**
 * لیست فایل‌ها در یک دایرکتوری
 */
function listFiles(dirPath, options = {}) {
  const { recursive = false, extensions = [] } = options;
  
  if (!exists(dirPath)) {
    return [];
  }

  let files = [];
  
  if (recursive) {
    files = walkDir(dirPath, extensions);
  } else {
    files = fs.readdirSync(dirPath)
      .map(file => path.join(dirPath, file))
      .filter(file => fs.statSync(file).isFile())
      .filter(file => extensions.length === 0 || extensions.includes(path.extname(file).toLowerCase()));
  }
  
  return files;
}

/**
 * پیمایش بازگشتی دایرکتوری
 */
function walkDir(dirPath, extensions = []) {
  let files = [];
  
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files = files.concat(walkDir(fullPath, extensions));
    } else if (stat.isFile()) {
      if (extensions.length === 0 || extensions.includes(path.extname(fullPath).toLowerCase())) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

/**
 * کپی فایل یا دایرکتوری
 */
function copy(src, dest) {
  const fsExtra = require('fs-extra');
  return fsExtra.copySync(src, dest, { overwrite: true });
}

/**
 * حذف فایل یا دایرکتوری
 */
function remove(path) {
  const fsExtra = require('fs-extra');
  return fsExtra.removeSync(path);
}

/**
 * ایجاد ID منحصر به فرد
 */
function generateId() {
  return uuidv4();
}

/**
 * ایجاد timestamp
 */
function timestamp() {
  return new Date().toISOString();
}

/**
 * فرمتی کردن تاریخ به فرمت فارسی
 */
function persianDate(date = new Date()) {
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  
  // در آینده می‌توان از کتابخانه‌های فارسی استفاده کرد
  return date.toLocaleDateString('fa-IR', options);
}

/**
 * بررسی اینکه آیا یک مسیر در لیست الگوها قرار دارد
 */
function matchesPattern(filePath, patterns) {
  const pathRelative = path.relative(PROJECT_ROOT, filePath);
  
  for (const pattern of patterns) {
    // تبدیل pattern به regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
      .replace(/\./g, '\\.');
    
    const regex = new RegExp(`^${regexPattern}$`);
    if (regex.test(pathRelative)) {
      return true;
    }
  }
  
  return false;
}

/**
 * فیلتر کردن فایل‌ها بر اساس الگوها
 */
function filterFiles(files, includePatterns = [], excludePatterns = []) {
  return files.filter(file => {
    // اگر includePatterns مشخص شده باشد
    if (includePatterns.length > 0) {
      if (!matchesPattern(file, includePatterns)) {
        return false;
      }
    }
    
    // اگر excludePatterns مشخص شده باشد
    if (excludePatterns.length > 0) {
      if (matchesPattern(file, excludePatterns)) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * دریافت اطلاعات فایل
 */
function getFileInfo(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      path: filePath,
      name: path.basename(filePath),
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      extension: path.extname(filePath)
    };
  } catch (error) {
    return null;
  }
}

/**
 * بررسی مجوزهای فایل
 */
function checkFilePermissions(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      readable: fs.accessSync(filePath, fs.constants.R_OK) === undefined,
      writable: fs.accessSync(filePath, fs.constants.W_OK) === undefined,
      executable: fs.accessSync(filePath, fs.constants.X_OK) === undefined,
      mode: stats.mode.toString(8)
    };
  } catch (error) {
    return {
      readable: false,
      writable: false,
      executable: false,
      mode: null
    };
  }
}

/**
 * جستجوی فایل‌ها بر اساس الگوی regex
 */
function searchFiles(dirPath, regex) {
  const files = walkDir(dirPath);
  const pattern = new RegExp(regex);
  
  return files.filter(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      return pattern.test(content);
    } catch (error) {
      return false;
    }
  });
}

/**
 * دریافت اطلاعات پروژه
 */
function getProjectInfo() {
  try {
    const packageJson = readJsonFile(path.join(PROJECT_ROOT, 'package.json'));
    return {
      name: packageJson?.name || 'Nikoo Dashboard',
      version: packageJson?.version || '1.0.0',
      description: packageJson?.description || '',
      root: PROJECT_ROOT
    };
  } catch (error) {
    return {
      name: 'Nikoo Dashboard',
      version: '1.0.0',
      description: '',
      root: PROJECT_ROOT
    };
  }
}

/**
 * بررسی اینکه آیا در محیط توسعه هستیم
 */
function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

/**
 * بررسی اینکه آیا در محیط تولید هستیم
 */
function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/**
 * تاخیر (sleep)
 */
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * اجرا با retry
 */
async function retryAsync(fn, options = {}) {
  const { maxRetries = 3, delay = 1000, backoff = 1 } = options;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      await sleep(delay * Math.pow(backoff, attempt - 1));
    }
  }
}

module.exports = {
  // فایل‌ها
  readJsonFile,
  writeJsonFile,
  readTextFile,
  writeTextFile,
  exists,
  listFiles,
  walkDir,
  copy,
  remove,
  
  // مسیرها
  getFileInfo,
  checkFilePermissions,
  matchesPattern,
  filterFiles,
  searchFiles,
  
  // پروژه
  getProjectInfo,
  PROJECT_ROOT,
  
  // ابزارهای عمومی
  generateId,
  timestamp,
  persianDate,
  isDevelopment,
  isProduction,
  sleep,
  retryAsync
};
