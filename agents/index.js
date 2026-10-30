/**
 * Nikoo AI Dashboard - Agent Harness Main Entry Point
 * شناسه سند: NIKOO-MVP-TECH-001
 * نسخه: 1.0
 * 
 * نقطه ورود اصلی سیستم ایجنت هارنس
 */

const { createLogger } = require('./shared/logger');
const { eventBus, SYSTEM_EVENTS } = require('./shared/events');
const controllerAgent = require('./controller');
const auditorAgent = require('./auditor');
const qaAgent = require('./qa');
const releaseAgent = require('./release');

// لاگر اصلی
const logger = createLogger('harness-main');

/**
 * شروع سیستم هارنس
 */
async function startHarness() {
  logger.info('Starting Nikoo AI Dashboard Agent Harness...');
  
  try {
    // شروع ایجنت کنترلر
    await controllerAgent.start();
    
    // ثبت رویداد شروع هارنس
    eventBus.emit(SYSTEM_EVENTS.HARNESS_STARTED, { 
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
    
    logger.success('Agent Harness started successfully!');
    
    // نمایش منوی CLI
    showCLIMenu();
    
    return true;
  } catch (error) {
    logger.error('Failed to start Agent Harness', { error: error.message });
    process.exit(1);
  }
}

/**
 * توقف سیستم هارنس
 */
async function stopHarness() {
  logger.info('Stopping Nikoo AI Dashboard Agent Harness...');
  
  try {
    await controllerAgent.stop();
    
    // ثبت رویداد توقف هارنس
    eventBus.emit(SYSTEM_EVENTS.HARNESS_STOPPED, { 
      timestamp: new Date().toISOString()
    });
    
    logger.success('Agent Harness stopped successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Failed to stop Agent Harness', { error: error.message });
    process.exit(1);
  }
}

/**
 * نمایش منوی CLI
 */
function showCLIMenu() {
  const readline = require('readline');
  const chalk = require('chalk');
  const figlet = require('figlet');
  
  // نمایش لوگو
  console.log(chalk.magenta(figlet.textSync('Nikoo AI', { horizontalLayout: 'full' })));
  console.log(chalk.blue(figlet.textSync('Dashboard', { horizontalLayout: 'full' })));
  console.log(chalk.cyan('Agent Harness v1.0.0\n'));
  
  // منوی اصلی
  const menu = `
${chalk.yellow('🚀 Nikoo AI Dashboard - Agent Harness Menu')}

${chalk.green('1.')} ${chalk.white('Run Full Workflow')}          - اجرا کردن گردش کار کامل
${chalk.green('2.')} ${chalk.white('Run Auditor')}               - اجرا کردن ممیزی پروژه
${chalk.green('3.')} ${chalk.white('Run QA Tests')}              - اجرا کردن آزمون‌های QA
${chalk.green('4.')} ${chalk.white('Create Package')}            - ایجاد بسته تحویل
${chalk.green('5.')} ${chalk.white('Check Acceptance Criteria')} - بررسی معیارهای پذیرش
${chalk.green('6.')} ${chalk.white('Show Harness Status')}       - نمایش وضعیت هارنس
${chalk.green('7.')} ${chalk.white('Show System Info')}          - نمایش اطلاعات سیستم
${chalk.green('8.')} ${chalk.white('Exit')}                       - خروج

${chalk.gray('—'.repeat(50))}
${chalk.blue('Enter your choice (1-8):')}
`;
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  function displayMenu() {
    console.log(menu);
    
    rl.question(chalk.cyan('> '), async (answer) => {
      try {
        switch (answer.trim()) {
          case '1':
            console.log(chalk.yellow('\n🔄 Running Full Workflow...\n'));
            const workflowResult = await controllerAgent.runWorkflow();
            console.log(chalk.green('\n✅ Workflow Result:'), workflowResult);
            break;
            
          case '2':
            console.log(chalk.yellow('\n🔍 Running Auditor...\n'));
            const auditResult = await controllerAgent.executeAgentTask('auditor', 'scanProject');
            console.log(chalk.green('\n✅ Audit Result:'), auditResult);
            break;
            
          case '3':
            console.log(chalk.yellow('\n🧪 Running QA Tests...\n'));
            const qaResult = await controllerAgent.executeAgentTask('qa', 'runAllAcceptanceCriteria');
            console.log(chalk.green('\n✅ QA Result:'), qaResult);
            break;
            
          case '4':
            console.log(chalk.yellow('\n📦 Creating Package...\n'));
            const packageResult = await controllerAgent.executeAgentTask('release', 'createPackage');
            console.log(chalk.green('\n✅ Package Result:'), packageResult);
            break;
            
          case '5':
            console.log(chalk.yellow('\n✅ Checking Acceptance Criteria...\n'));
            const qaAgent = require('./qa');
            const criteriaResult = await qaAgent.runAllAcceptanceCriteria();
            console.log(chalk.green('\n✅ Criteria Results:'));
            console.log('Passed:', criteriaResult.summary.passed);
            console.log('Failed:', criteriaResult.summary.failed);
            break;
            
          case '6':
            console.log(chalk.yellow('\n📊 Harness Status:\n'));
            const statusResult = await controllerAgent.executeTask('getHarnessStatus');
            console.log(chalk.green(JSON.stringify(statusResult.status, null, 2)));
            break;
            
          case '7':
            console.log(chalk.yellow('\nℹ️ System Information:\n'));
            displaySystemInfo();
            break;
            
          case '8':
            console.log(chalk.yellow('\n👋 Exiting...\n'));
            await stopHarness();
            break;
            
          default:
            console.log(chalk.red('\n❌ Invalid choice. Please try again.\n'));
        }
        
        // نمایش مجدد منو
        setTimeout(displayMenu, 1000);
      } catch (error) {
        console.log(chalk.red('\n❌ Error:'), error.message);
        setTimeout(displayMenu, 1000);
      }
    });
  }
  
  displayMenu();
}

/**
 * نمایش اطلاعات سیستم
 */
function displaySystemInfo() {
  const os = require('os');
  const chalk = require('chalk');
  
  console.log(chalk.blue('💻 System Information:'));
  console.log(chalk.gray('—'.repeat(40)));
  console.log(chalk.white(`Platform: ${os.platform()}`));
  console.log(chalk.white(`Architecture: ${os.arch()}`));
  console.log(chalk.white(`CPU Cores: ${os.cpus().length}`));
  console.log(chalk.white(`Total Memory: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`));
  console.log(chalk.white(`Free Memory: ${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`));
  console.log(chalk.white(`Node.js Version: ${process.version}`));
  console.log(chalk.white(`Current Directory: ${process.cwd()}`));
  console.log('');
}

/**
 * صادات ایجنت‌ها
 */
module.exports = {
  startHarness,
  stopHarness,
  controllerAgent,
  auditorAgent,
  qaAgent,
  releaseAgent,
  eventBus,
  SYSTEM_EVENTS,
  PROJECT_EVENTS
};

// اگر فایل به صورت مستقیم اجرا شد
if (require.main === module) {
  startHarness().catch(err => {
    console.error('Failed to start harness:', err);
    process.exit(1);
  });
}
