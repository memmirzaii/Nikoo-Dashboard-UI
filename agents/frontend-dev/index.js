/**
 * Nikoo AI Dashboard - Frontend Developer Agent
 * 
 * : NIKOO-MVP-TECH-001
 * 
 * : 1.0
 * 
 *  :
 * -   
 * -   
 * -   
 * -   
 */

const path = require('path');
const fs = require('fs');
const { BaseAgent } = require('../shared/agent-base');
const { createLogger } = require('../shared/logger');
const { getConfig, PROJECT_ROOT } = require('../shared/harness-config');
const { writeJsonFile, exists } = require('../shared/utils');

class FrontendDevAgent extends BaseAgent {
  constructor() {
    super('frontend-dev', { logLevel: 'info' });
    this.config = getConfig('frontend-dev');
    this.logger = createLogger('frontend-dev');
    
    //  
    this.projectStructure = {
      pages: [
        'dashboard',
        'projects',
        'ai-assistant',
        'users',
        'crm',
        'shop',
        'financial',
        'settings'
      ],
      components: [
        'Button',
        'Card',
        'Input',
        'Modal',
        'Sidebar',
        'Navbar',
        'Table',
        'Form',
        'Chart',
        'Alert'
      ]
    };
    
    //  
    this.pagesDir = path.join(PROJECT_ROOT, 'pages');
    this.componentsDir = path.join(PROJECT_ROOT, 'components');
    this.assetsDir = path.join(PROJECT_ROOT, 'assets');
    this.cssDir = path.join(this.assetsDir, 'css');
    this.jsDir = path.join(this.assetsDir, 'js');
    this.imagesDir = path.join(this.assetsDir, 'images');
    this.fontsDir = path.join(this.assetsDir, 'fonts');
  }

  /**
   *   start 
   */
  async onStart() {
    this.logger.info('Frontend Developer Agent starting...');
    await this.initialize();
  }

  /**
   *  
   */
  async initialize() {
    this.logger.info('Initializing Frontend Developer Agent...');
    
    //   
    [this.pagesDir, this.componentsDir, this.cssDir, this.jsDir, this.imagesDir, this.fontsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    this.logger.success('Frontend Developer Agent initialized successfully');
  }

  /**
   *  
   */
  tasks = {
    /**
     *   
     */
    createBaseStructure: async (params = {}) => {
      this.logger.info('Creating base project structure...');
      
      try {
        //   
        await this.createIndexHtml();
        
        //   
        await this.createMainStyles();
        
        //   
        await this.createMainScript();
        
        //   
        await this.createPackageJson();
        
        this.logger.success('Base project structure created successfully');
        return {
          success: true,
          structure: this.projectStructure,
          filesCreated: [
            path.join(PROJECT_ROOT, 'index.html'),
            path.join(this.cssDir, 'input.css'),
            path.join(this.cssDir, 'output.css'),
            path.join(this.jsDir, 'main.js'),
            path.join(PROJECT_ROOT, 'package.json')
          ]
        };
      } catch (error) {
        this.logger.error('Failed to create base structure', { error: error.message });
        throw error;
      }
    },

    /**
     *   index.html
     */
    createIndexHtml: async () => {
      this.logger.info('Creating index.html...');
      
      const indexContent = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nikoo AI Dashboard</title>
  <meta name="description" content="  ">
  <link rel="stylesheet" href="assets/css/output.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Vazir:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <script src="assets/js/main.js" defer></script>
</head>
<body class="bg-gray-50 font-sans">
  <div id="app">
    <!-- App will be loaded here -->
  </div>
</body>
</html>`;
      
      fs.writeFileSync(path.join(PROJECT_ROOT, 'index.html'), indexContent, 'utf8');
      this.logger.success('index.html created successfully');
    },

    /**
     *   Tailwind CSS
     */
    createMainStyles: async () => {
      this.logger.info('Creating main styles...');
      
      const inputCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom base styles */
@layer base {
  html {
    @apply text-gray-900 antialiased;
  }
  
  body {
    @apply bg-gray-50;
  }
}

/* Custom component classes */
@layer components {
  .btn-primary {
    @apply px-4 py-2 rounded-lg font-medium transition-colors duration-200 bg-brand-primary text-white hover:bg-brand-primary/90;
  }
  
  .btn-secondary {
    @apply px-4 py-2 rounded-lg font-medium border transition-colors duration-200 bg-transparent border-gray-300 text-gray-700 hover:bg-gray-50;
  }
  
  .card {
    @apply bg-white rounded-xl shadow-sm border border-gray-200 p-6;
  }
  
  .input-field {
    @apply w-full px-4 py-2 rounded-lg border bg-white transition-colors duration-200 border-gray-300 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20;
  }
}

/* Custom utility classes */
@layer utilities {
  .text-brand {
    @apply text-brand-primary;
  }
  
  .bg-brand {
    @apply bg-brand-primary;
  }
  
  .border-brand {
    @apply border-brand-primary;
  }
}`;
      
      fs.writeFileSync(path.join(this.cssDir, 'input.css'), inputCss, 'utf8');
      
      //   output.css
      fs.writeFileSync(path.join(this.cssDir, 'output.css'), '', 'utf8');
      
      this.logger.success('Main styles created successfully');
    },

    /**
     *   main.js
     */
    createMainScript: async () => {
      this.logger.info('Creating main script...');
      
      const mainJs = `/**
 * Nikoo AI Dashboard - Main JavaScript
 * : NIKOO-MVP-TECH-001
 */

//   
const app = {
  init: function() {
    console.log('Nikoo AI Dashboard initialized');
    this.setupEventListeners();
    this.loadPages();
  },
  
  setupEventListeners: function() {
    //   
    document.addEventListener('DOMContentLoaded', () => {
      this.init();
    });
  },
  
  loadPages: function() {
    //   
    console.log('Loading pages...');
  }
};

//  
if (typeof module !== 'undefined' && module.exports) {
  module.exports = app;
}`;
      
      fs.writeFileSync(path.join(this.jsDir, 'main.js'), mainJs, 'utf8');
      this.logger.success('Main script created successfully');
    },

    /**
     *   package.json
     */
    createPackageJson: async () => {
      this.logger.info('Creating package.json...');
      
      const packageJson = {
        name: 'nikoo-dashboard-ui',
        version: '1.0.0',
        description: 'Nikoo AI Dashboard -   ',
        main: 'index.html',
        scripts: {
          dev: 'concurrently "npm run serve" "npm run watch:css"',
          serve: 'http-server -p 3000 -c-1',
          build: 'npm run build:css && npm run build:js',
          'build:css': 'tailwindcss -i assets/css/input.css -o assets/css/output.css --minify',
          'build:js': 'node scripts/build.js',
          lint: 'eslint .',
          test: 'jest',
          'watch:css': 'tailwindcss -i assets/css/input.css -o assets/css/output.css --watch'
        },
        dependencies: {
          'concurrently': '^8.2.2',
          'http-server': '^14.1.1'
        },
        devDependencies: {
          'tailwindcss': '^3.4.0',
          'postcss': '^8.4.32',
          'autoprefixer': '^10.4.16',
          'eslint': '^8.56.0',
          'jest': '^29.7.0',
          'prettier': '^3.1.1'
        },
        engines: {
          node: '>=18.0.0'
        },
        author: 'Nikoo Team',
        license: 'MIT'
      };
      
      await writeJsonFile(path.join(PROJECT_ROOT, 'package.json'), packageJson);
      this.logger.success('package.json created successfully');
    },

    /**
     *   
     */
    developModules: async (params = {}) => {
      this.logger.info('Developing modules...');
      
      try {
        //   
        await this.createPages();
        
        //   
        await this.createComponents();
        
        this.logger.success('Modules developed successfully');
        return {
          success: true,
          pagesCreated: this.projectStructure.pages,
          componentsCreated: this.projectStructure.components
        };
      } catch (error) {
        this.logger.error('Failed to develop modules', { error: error.message });
        throw error;
      }
    },

    /**
     *   
     */
    createPages: async () => {
      this.logger.info('Creating pages...');
      
      const pageTemplates = {
        dashboard: this.generateDashboardPage(),
        projects: this.generateProjectsPage(),
        'ai-assistant': this.generateAIAssistantPage(),
        users: this.generateUsersPage(),
        crm: this.generateCRMPage(),
        shop: this.generateShopPage(),
        financial: this.generateFinancialPage(),
        settings: this.generateSettingsPage()
      };
      
      for (const [pageName, content] of Object.entries(pageTemplates)) {
        const filePath = path.join(this.pagesDir, `${pageName}.html`);
        fs.writeFileSync(filePath, content, 'utf8');
        this.logger.success(`Created page: ${pageName}.html`);
      }
    },

    /**
     *   
     */
    createComponents: async () => {
      this.logger.info('Creating components...');
      
      const componentTemplates = {
        Button: this.generateButtonComponent(),
        Card: this.generateCardComponent(),
        Input: this.generateInputComponent(),
        Modal: this.generateModalComponent(),
        Sidebar: this.generateSidebarComponent(),
        Navbar: this.generateNavbarComponent(),
        Table: this.generateTableComponent(),
        Form: this.generateFormComponent(),
        Chart: this.generateChartComponent(),
        Alert: this.generateAlertComponent()
      };
      
      for (const [componentName, content] of Object.entries(componentTemplates)) {
        const filePath = path.join(this.componentsDir, `${componentName}.html`);
        fs.writeFileSync(filePath, content, 'utf8');
        this.logger.success(`Created component: ${componentName}.html`);
      }
    },

    /**
     *   Dashboard
     */
    generateDashboardPage: function() {
      return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title> - Nikoo AI Dashboard</title>
  <link rel="stylesheet" href="../assets/css/output.css">
</head>
<body class="bg-gray-50">
  <div class="min-h-screen">
    <!-- Dashboard content will be loaded here -->
    <h1 class="text-2xl font-bold text-gray-900 p-6"></h1>
  </div>
</body>
</html>`;
    },

    /**
     *    
     */
    generateProjectsPage: function() {
      return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>  - Nikoo AI Dashboard</title>
  <link rel="stylesheet" href="../assets/css/output.css">
</head>
<body class="bg-gray-50">
  <div class="min-h-screen">
    <h1 class="text-2xl font-bold text-gray-900 p-6"> </h1>
  </div>
</body>
</html>`;
    },

    /**
     *   AI Assistant
     */
    generateAIAssistantPage: function() {
      return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>   - Nikoo AI Dashboard</title>
  <link rel="stylesheet" href="../assets/css/output.css">
</head>
<body class="bg-gray-50">
  <div class="min-h-screen">
    <h1 class="text-2xl font-bold text-gray-900 p-6">  </h1>
  </div>
</body>
</html>`;
    },

    /**
     *   Users
     */
    generateUsersPage: function() {
      return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>  - Nikoo AI Dashboard</title>
  <link rel="stylesheet" href="../assets/css/output.css">
</head>
<body class="bg-gray-50">
  <div class="min-h-screen">
    <h1 class="text-2xl font-bold text-gray-900 p-6"> </h1>
  </div>
</body>
</html>`;
    },

    /**
     *   CRM
     */
    generateCRMPage: function() {
      return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CRM - Nikoo AI Dashboard</title>
  <link rel="stylesheet" href="../assets/css/output.css">
</head>
<body class="bg-gray-50">
  <div class="min-h-screen">
    <h1 class="text-2xl font-bold text-gray-900 p-6">CRM</h1>
  </div>
</body>
</html>`;
    },

    /**
     *   Shop
     */
    generateShopPage: function() {
      return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>  - Nikoo AI Dashboard</title>
  <link rel="stylesheet" href="../assets/css/output.css">
</head>
<body class="bg-gray-50">
  <div class="min-h-screen">
    <h1 class="text-2xl font-bold text-gray-900 p-6"> </h1>
  </div>
</body>
</html>`;
    },

    /**
     *   Financial
     */
    generateFinancialPage: function() {
      return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>  - Nikoo AI Dashboard</title>
  <link rel="stylesheet" href="../assets/css/output.css">
</head>
<body class="bg-gray-50">
  <div class="min-h-screen">
    <h1 class="text-2xl font-bold text-gray-900 p-6"> </h1>
  </div>
</body>
</html>`;
    },

    /**
     *   Settings
     */
    generateSettingsPage: function() {
      return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title> - Nikoo AI Dashboard</title>
  <link rel="stylesheet" href="../assets/css/output.css">
</head>
<body class="bg-gray-50">
  <div class="min-h-screen">
    <h1 class="text-2xl font-bold text-gray-900 p-6"></h1>
  </div>
</body>
</html>`;
    },

    //    
    generateButtonComponent: function() {
      return `<!-- Button Component -->
<button class="px-4 py-2 rounded-lg font-medium transition-colors duration-200 bg-brand-primary text-white hover:bg-brand-primary/90">
  
</button>`;
    },

    generateCardComponent: function() {
      return `<!-- Card Component -->
<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
  <h3 class="text-lg font-semibold text-gray-900 mb-2"> </h3>
  <p class="text-gray-600">  </p>
</div>`;
    },

    generateInputComponent: function() {
      return `<!-- Input Component -->
<input 
  type="text" 
  class="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white transition-colors duration-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
  placeholder=""
/>`;
    },

    generateModalComponent: function() {
      return `<!-- Modal Component -->
<div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
  <div class="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
    <div class="p-6 border-b border-gray-200">
      <h3 class="text-lg font-semibold text-gray-900"> </h3>
    </div>
    <div class="p-6">
      <p class="text-gray-600"> </p>
    </div>
    <div class="p-6 border-t border-gray-200 flex justify-end gap-3">
      <button class="px-4 py-2 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50">
        
      </button>
      <button class="px-4 py-2 rounded-lg font-medium bg-brand-primary text-white hover:bg-brand-primary/90">
        
      </button>
    </div>
  </div>
</div>`;
    },

    generateSidebarComponent: function() {
      return `<!-- Sidebar Component -->
<aside class="w-64 bg-white shadow-sm h-screen fixed left-0 top-0 z-40">
  <div class="p-4">
    <h2 class="text-xl font-bold text-brand-primary">Nikoo AI</h2>
  </div>
  <nav class="mt-6">
    <ul class="space-y-1">
      <li><a href="dashboard.html" class="block px-4 py-2 text-gray-700 hover:bg-gray-100"></a></li>
      <li><a href="projects.html" class="block px-4 py-2 text-gray-700 hover:bg-gray-100"></a></li>
      <li><a href="ai-assistant.html" class="block px-4 py-2 text-gray-700 hover:bg-gray-100"> </a></li>
    </ul>
  </nav>
</aside>`;
    },

    generateNavbarComponent: function() {
      return `<!-- Navbar Component -->
<nav class="bg-white shadow-sm border-b fixed top-0 right-0 left-64 z-30">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16">
      <div class="flex">
        <h1 class="text-lg font-semibold text-gray-900"></h1>
      </div>
      <div class="flex items-center space-x-4">
        <button class="px-4 py-2 rounded-lg font-medium bg-brand-primary text-white hover:bg-brand-primary/90">
           
        </button>
      </div>
    </div>
  </div>
</nav>`;
    },

    generateTableComponent: function() {
      return `<!-- Table Component -->
<div class="overflow-x-auto rounded-lg border border-gray-200">
  <table class="w-full text-sm">
    <thead class="bg-gray-50 text-gray-700 font-medium">
      <tr>
        <th class="px-4 py-3 text-right"></th>
        <th class="px-4 py-3 text-right"></th>
      </tr>
    </thead>
    <tbody>
      <tr class="border-b border-gray-200 hover:bg-gray-50">
        <td class="px-4 py-3"> 1</td>
        <td class="px-4 py-3"> 1</td>
      </tr>
    </tbody>
  </table>
</div>`;
    },

    generateFormComponent: function() {
      return `<!-- Form Component -->
<form class="space-y-4">
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2"></label>
    <input 
      type="text" 
      class="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white transition-colors duration-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
      placeholder=""
    />
  </div>
  <button type="submit" class="px-4 py-2 rounded-lg font-medium bg-brand-primary text-white hover:bg-brand-primary/90">
    
  </button>
</form>`;
    },

    generateChartComponent: function() {
      return `<!-- Chart Component -->
<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
  <h3 class="text-lg font-semibold text-gray-900 mb-4"> </h3>
  <div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
    <p class="text-gray-500">  </p>
  </div>
</div>`;
    },

    generateAlertComponent: function() {
      return `<!-- Alert Component -->
<div class="p-4 rounded-lg bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
  <p class="text-sm"> </p>
</div>`;
    }
  };

  /**
   *   
   */
  getReport() {
    return {
      ...super.getReport(),
      projectStructure: this.projectStructure
    };
  }
}

//   
const frontendDevAgent = new FrontendDevAgent();
module.exports = frontendDevAgent;
