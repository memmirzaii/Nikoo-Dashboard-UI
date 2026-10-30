/**
 * Nikoo AI Dashboard - UI Designer Agent
 * 
: NIKOO-MVP-TECH-001
 * 
 * 
: 1.0
 * 
 *   
 * :
 * -   
 * -   
 * -   
 * -   
 */

const path = require('path');
const fs = require('fs');
const { BaseAgent } = require('../shared/agent-base');
const { createLogger } = require('../shared/logger');
const { getConfig, PROJECT_ROOT } = require('../shared/harness-config');
const { writeJsonFile, exists } = require('../shared/utils');

class UIDesignerAgent extends BaseAgent {
  constructor() {
    super('ui-designer', { logLevel: 'info' });
    this.config = getConfig('ui-designer');
    this.logger = createLogger('ui-designer');
    
    // 
 
    this.designSystem = {
      colors: this.getDefaultColors(),
      fonts: this.getDefaultFonts(),
      spacing: this.getDefaultSpacing(),
      typography: this.getDefaultTypography(),
      components: this.getDefaultComponents(),
      breakpoints: this.getDefaultBreakpoints(),
      shadows: this.getDefaultShadows(),
      borders: this.getDefaultBorders(),
      animations: this.getDefaultAnimations()
    };
    
    //  
    this.outputDir = path.join(PROJECT_ROOT, 'docs');
    this.designSystemFile = path.join(this.outputDir, 'DESIGN-SYSTEM.md');
    this.designConfigFile = path.join(PROJECT_ROOT, 'config', 'design-system.json');
  }

  /**
   *   
   */
  getDefaultColors() {
    return {
      primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
        950: '#172554'
      },
      secondary: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
        950: '#020617'
      },
      success: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d'
      },
      warning: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f',
        950: '#451a03'
      },
      danger: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d',
        950: '#450a0a'
      },
      info: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a'
      },
      light: {
        50: '#fafafa',
        100: '#f4f4f5',
        200: '#e4e4e7',
        300: '#d4d4d8',
        400: '#a1a1aa',
        500: '#71717a',
        600: '#52525b',
        700: '#3f3f46',
        800: '#27272a',
        900: '#18181b'
      },
      dark: {
        50: '#f7f7f8',
        100: '#eeeef0',
        200: '#d9d9de',
        300: '#b8b8c1',
        400: '#93939f',
        500: '#767684',
        600: '#5c5c6c',
        700: '#484856',
        800: '#393944',
        900: '#27272e'
      },
      // 
 
      brand: {
        primary: '#6366F1',
        secondary: '#8B5CF6',
        accent: '#10B981',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444'
      },
      //  
      semantic: {
        background: '#F8FAFC',
        surface: '#FFFFFF',
        border: '#E2E8F0',
        text: {
          primary: '#1E293B',
          secondary: '#64748B',
          muted: '#94A3B8'
        }
      }
    };
  }

  /**
   *  
   */
  getDefaultFonts() {
    return {
      primary: {
        family: 'Vazir, sans-serif',
        weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
        description: '
 '
      },
      secondary: {
        family: 'Inter, sans-serif',
        weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
        description: ''
      },
      code: {
        family: 'JetBrains Mono, monospace',
        weights: [400, 500, 600, 700],
        description: ' '
      }
    };
  }

  /**
   *  
   */
  getDefaultSpacing() {
    return {
      base: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
      '3xl': '4rem',
      '4xl': '6rem'
    };
  }

  /**
   *  
   */
  getDefaultTypography() {
    return {
      h1: {
        fontSize: '2.25rem',
        fontWeight: '700',
        lineHeight: '2.5rem',
        letterSpacing: '-0.025em'
      },
      h2: {
        fontSize: '1.875rem',
        fontWeight: '600',
        lineHeight: '2.25rem',
        letterSpacing: '-0.025em'
      },
      h3: {
        fontSize: '1.5rem',
        fontWeight: '600',
        lineHeight: '2rem',
        letterSpacing: '-0.025em'
      },
      h4: {
        fontSize: '1.25rem',
        fontWeight: '600',
        lineHeight: '1.75rem'
      },
      h5: {
        fontSize: '1.125rem',
        fontWeight: '600',
        lineHeight: '1.75rem'
      },
      h6: {
        fontSize: '1rem',
        fontWeight: '600',
        lineHeight: '1.5rem'
      },
      body: {
        fontSize: '1rem',
        fontWeight: '400',
        lineHeight: '1.5rem'
      },
      caption: {
        fontSize: '0.875rem',
        fontWeight: '400',
        lineHeight: '1.25rem'
      },
      button: {
        fontSize: '1rem',
        fontWeight: '500',
        lineHeight: '1.5rem'
      }
    };
  }

  /**
   *  
   */
  getDefaultComponents() {
    return {
      buttons: {
        primary: {
          base: 'px-4 py-2 rounded-lg font-medium transition-colors duration-200',
          normal: 'bg-brand-primary text-white hover:bg-brand-primary/90',
          disabled: 'bg-gray-300 text-gray-500 cursor-not-allowed',
          sizes: {
            sm: 'text-sm px-3 py-1.5',
            md: 'text-base px-4 py-2',
            lg: 'text-lg px-6 py-3'
          }
        },
        secondary: {
          base: 'px-4 py-2 rounded-lg font-medium border transition-colors duration-200',
          normal: 'bg-transparent border-gray-300 text-gray-700 hover:bg-gray-50',
          disabled: 'border-gray-200 text-gray-400 cursor-not-allowed'
        },
        ghost: {
          base: 'px-4 py-2 rounded-lg font-medium transition-colors duration-200',
          normal: 'bg-transparent text-gray-700 hover:bg-gray-100'
        }
      },
      cards: {
        base: 'bg-white rounded-xl shadow-sm border border-gray-200',
        padding: 'p-6',
        hover: 'hover:shadow-md transition-shadow duration-200'
      },
      inputs: {
        base: 'w-full px-4 py-2 rounded-lg border bg-white transition-colors duration-200',
        normal: 'border-gray-300 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20',
        error: 'border-danger-500 focus:border-danger-500 focus:ring-2 focus:ring-danger-500/20',
        disabled: 'border-gray-200 bg-gray-50 cursor-not-allowed'
      },
      modals: {
        backdrop: 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50',
        container: 'fixed inset-0 flex items-center justify-center z-50 p-4',
        content: 'bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto',
        header: 'p-6 border-b border-gray-200',
        body: 'p-6',
        footer: 'p-6 border-t border-gray-200 flex justify-end gap-3'
      },
      tables: {
        container: 'overflow-x-auto rounded-lg border border-gray-200',
        table: 'w-full text-sm',
        header: 'bg-gray-50 text-gray-700 font-medium',
        row: 'border-b border-gray-200 hover:bg-gray-50',
        cell: 'px-4 py-3'
      },
      forms: {
        label: 'block text-sm font-medium text-gray-700 mb-2',
        helper: 'text-xs text-gray-500 mt-1',
        error: 'text-xs text-danger-600 mt-1'
      }
    };
  }

  /**
   *  
   */
  getDefaultBreakpoints() {
    return {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    };
  }

  /**
   *  
   */
  getDefaultShadows() {
    return {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
    };
  }

  /**
   *  
   */
  getDefaultBorders() {
    return {
      none: '0',
      sm: '1px',
      md: '2px',
      lg: '4px',
      radius: {
        none: '0',
        sm: '0.125rem',
        md: '0.25rem',
        lg: '0.375rem',
        xl: '0.5rem',
        '2xl': '0.75rem',
        '3xl': '1rem',
        full: '9999px'
      }
    };
  }

  /**
   *  
   */
  getDefaultAnimations() {
    return {
      fadeIn: 'opacity-0 animate-fadeIn',
      slideUp: 'translate-y-4 opacity-0 animate-slideUp',
      slideDown: 'translate-y-4 opacity-0 animate-slideDown',
      scaleIn: 'scale-95 opacity-0 animate-scaleIn',
      spin: 'animate-spin',
      pulse: 'animate-pulse',
      bounce: 'animate-bounce'
    };
  }

  /**
   *   start 
   */
  async onStart() {
    this.logger.info('UI Designer Agent starting...');
    await this.initialize();
  }

  /**
   *  
   */
  async initialize() {
    this.logger.info('Initializing UI Designer Agent...');
    
    //   
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    this.logger.success('UI Designer Agent initialized successfully');
  }

  /**
   *  
   */
  tasks = {
    /**
     *   
     */
    createDesignSystem: async (params = {}) => {
      this.logger.info('Creating design system...');
      
      try {
        //   
        await this.generateDesignSystemMarkdown();
        
        //   
        await this.generateDesignConfig();
        
        //  
        await this.generateTailwindConfig();
        
        this.logger.success('Design system created successfully');
        return {
          success: true,
          designSystem: this.designSystem,
          filesCreated: [
            this.designSystemFile,
            this.designConfigFile,
            path.join(PROJECT_ROOT, 'tailwind.config.js')
          ]
        };
      } catch (error) {
        this.logger.error('Failed to create design system', { error: error.message });
        throw error;
      }
    },

    /**
     *   
     */
    generateDesignSystemMarkdown: async () => {
      this.logger.info('Generating design system markdown documentation...');
      
      const markdownContent = this.generateMarkdownContent();
      fs.writeFileSync(this.designSystemFile, markdownContent, 'utf8');
      
      this.logger.success(`Design system markdown saved to ${this.designSystemFile}`);
    },

    /**
     *   
     */
    generateDesignConfig: async () => {
      this.logger.info('Generating design system configuration...');
      
      const configContent = {
        version: '1.0.0',
        project: this.config.general.projectName,
        colors: this.designSystem.colors,
        fonts: this.designSystem.fonts,
        spacing: this.designSystem.spacing,
        typography: this.designSystem.typography,
        breakpoints: this.designSystem.breakpoints,
        shadows: this.designSystem.shadows,
        borders: this.designSystem.borders,
        animations: this.designSystem.animations,
        components: this.designSystem.components
      };
      
      await writeJsonFile(this.designConfigFile, configContent);
      this.logger.success(`Design system config saved to ${this.designConfigFile}`);
    },

    /**
     *   Tailwind
     */
    generateTailwindConfig: async () => {
      this.logger.info('Generating Tailwind CSS configuration...');
      
      const tailwindConfig = {
        content: [
          './pages/**/*.{html,js}',
          './components/**/*.{html,js}',
          './index.html'
        ],
        theme: {
          extend: {
            colors: {
              brand: this.designSystem.colors.brand,
              primary: this.designSystem.colors.primary,
              secondary: this.designSystem.colors.secondary,
              success: this.designSystem.colors.success,
              warning: this.designSystem.colors.warning,
              danger: this.designSystem.colors.danger,
              info: this.designSystem.colors.info
            },
            fontFamily: {
              sans: [this.designSystem.fonts.primary.family, 'sans-serif'],
              secondary: [this.designSystem.fonts.secondary.family, 'sans-serif'],
              code: [this.designSystem.fonts.code.family, 'monospace']
            },
            spacing: this.designSystem.spacing,
            screens: this.designSystem.breakpoints,
            boxShadow: this.designSystem.shadows,
            borderRadius: this.designSystem.borders.radius
          }
        },
        plugins: []
      };
      
      const configContent = `/** @type {import('tailwindcss').Config} */
module.exports = ${JSON.stringify(tailwindConfig, null, 2)}`;
      
      const configPath = path.join(PROJECT_ROOT, 'tailwind.config.js');
      fs.writeFileSync(configPath, configContent, 'utf8');
      
      this.logger.success(`Tailwind config saved to ${configPath}`);
    },

    /**
     *   
     */
    generateMarkdownContent: function() {
      return `# 
  

** :** NIKOO-MVP-TECH-001  
**:** 1.0  
**:** ${new Date().toLocaleDateString('fa-IR')}  

---

## 

### 

|  |  |  |
|------|-----------|----------------|
|  |  |  |
|  |  |  |

### 

${Object.entries(this.designSystem.colors).map(([category, colors]) => {
  return `#### ${category}

| Level | Hex | Preview |
|-------|-----|---------|
${Object.entries(colors).map(([level, hex]) => {
  return `| ${level} | ${hex} | <span style="background-color: ${hex}; width: 50px; height: 20px; display: inline-block; border: 1px solid #ddd;"></span> |`;
}).join('\n')}`;
}).join('\n\n')}

---

## 

### 

|  |  |  |
|------|-----------|----------------|
|  |  |  |

---

## 

### 

|  |  |
|------|-----------|
${Object.entries(this.designSystem.breakpoints).map(([name, value]) => {
  return `| ${name} | ${value} |`;
}).join('\n')}

---

## 

### 

|  |  |  |
|------|-----------|----------------|
| h1 | ${this.designSystem.typography.h1.fontSize} | ${this.designSystem.typography.h1.fontWeight} |
| h2 | ${this.designSystem.typography.h2.fontSize} | ${this.designSystem.typography.h2.fontWeight} |
| h3 | ${this.designSystem.typography.h3.fontSize} | ${this.designSystem.typography.h3.fontWeight} |

---

## 

###  

        

       `;
    },

    /**
     *   
     */
    createComponentLibrary: async (params = {}) => {
      this.logger.info('Creating component library...');
      
      try {
        const componentsDir = path.join(PROJECT_ROOT, 'components');
        if (!fs.existsSync(componentsDir)) {
          fs.mkdirSync(componentsDir, { recursive: true });
        }
        
        //   
        const buttonComponent = this.generateButtonComponent();
        const cardComponent = this.generateCardComponent();
        const inputComponent = this.generateInputComponent();
        const modalComponent = this.generateModalComponent();
        
        //  
        fs.writeFileSync(path.join(componentsDir, 'Button.html'), buttonComponent, 'utf8');
        fs.writeFileSync(path.join(componentsDir, 'Card.html'), cardComponent, 'utf8');
        fs.writeFileSync(path.join(componentsDir, 'Input.html'), inputComponent, 'utf8');
        fs.writeFileSync(path.join(componentsDir, 'Modal.html'), modalComponent, 'utf8');
        
        this.logger.success('Component library created successfully');
        return {
          success: true,
          componentsCreated: ['Button', 'Card', 'Input', 'Modal']
        };
      } catch (error) {
        this.logger.error('Failed to create component library', { error: error.message });
        throw error;
      }
    },

    /**
     *   Button
     */
    generateButtonComponent: function() {
      return `<!-- Button Component -->
<button class="px-4 py-2 rounded-lg font-medium transition-colors duration-200 bg-brand-primary text-white hover:bg-brand-primary/90">
  
</button>`;
    },

    /**
     *   Card
     */
    generateCardComponent: function() {
      return `<!-- Card Component -->
<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
  <h3 class="text-lg font-semibold text-gray-900 mb-2"> </h3>
  <p class="text-gray-600">  </p>
</div>`;
    },

    /**
     *   Input
     */
    generateInputComponent: function() {
      return `<!-- Input Component -->
<input 
  type="text" 
  class="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white transition-colors duration-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
  placeholder=""
/>`;
    },

    /**
     *   Modal
     */
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
    }
  };

  /**
   *   
   */
  getDesignSystem() {
    return this.designSystem;
  }

  /**
   *   
   */
  getReport() {
    return {
      ...super.getReport(),
      designSystem: this.designSystem
    };
  }
}

//   
const uiDesignerAgent = new UIDesignerAgent();
module.exports = uiDesignerAgent;
