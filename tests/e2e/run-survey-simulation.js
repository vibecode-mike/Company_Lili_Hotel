/**
 * Standalone Survey Creation Flow Simulation Script
 *
 * This script uses Playwright to simulate:
 * 1. Clicking '問卷模板' in the sidebar
 * 2. Clicking '建立問卷' button
 * 3. Interacting with the survey creation form
 * 4. Taking screenshots of the process
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5174';

async function runSurveySimulation() {
  console.log('🚀 Starting Survey Creation Flow Simulation...\n');

  const browser = await chromium.launch({
    headless: false, // Set to true for headless mode
    slowMo: 500, // Slow down by 500ms to see the actions
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  });

  const page = await context.newPage();

  try {
    // Step 1: Navigate to application
    console.log('📍 Step 1: Navigating to application...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/01-home-page.png' });
    console.log('   ✓ Home page loaded');

    // Step 2: Click on '問卷模板' in sidebar
    console.log('\n📍 Step 2: Clicking on 問卷模板 in sidebar...');
    try {
      await page.click('text=問卷模板', { timeout: 5000 });
      await page.waitForURL('**/surveys', { timeout: 5000 });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/02-survey-list-page.png' });
      console.log('   ✓ Navigated to survey list page');
    } catch (error) {
      console.log('   ⚠ Could not find 問卷模板 in sidebar, navigating directly...');
      await page.goto(`${BASE_URL}/surveys`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/02-survey-list-page-direct.png' });
    }

    // Step 3: Click '建立問卷' button
    console.log('\n📍 Step 3: Clicking 建立問卷 button...');
    try {
      await page.click('button:has-text("建立問卷")', { timeout: 5000 });
      await page.waitForURL('**/surveys/create', { timeout: 5000 });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/03-survey-create-page-initial.png' });
      console.log('   ✓ Opened survey creation page');
    } catch (error) {
      console.log('   ⚠ Could not find button, navigating directly to create page...');
      await page.goto(`${BASE_URL}/surveys/create`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/03-survey-create-page-direct.png' });
    }

    // Step 4: Verify phone simulator is visible
    console.log('\n📍 Step 4: Verifying phone simulator...');
    const phoneSimulator = await page.locator('.phone-simulator');
    const isVisible = await phoneSimulator.isVisible();
    if (isVisible) {
      console.log('   ✓ Phone simulator is visible');
      await page.screenshot({ path: 'screenshots/04-phone-simulator-visible.png' });
    } else {
      console.log('   ✗ Phone simulator not found');
    }

    // Step 5: Fill in survey name
    console.log('\n📍 Step 5: Filling in survey name...');
    const surveyName = '測試問卷 - 住客滿意度調查 ' + new Date().toISOString().split('T')[0];
    // Use a more flexible selector
    await page.locator('.ant-input').first().fill(surveyName);
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/05-survey-name-filled.png' });
    console.log(`   ✓ Filled survey name: ${surveyName}`);

    // Step 6: Open template dropdown
    console.log('\n📍 Step 6: Opening template dropdown...');
    // Click on the template selector by finding the select with placeholder text
    await page.locator('.ant-select-selector').nth(0).click();
    await page.waitForSelector('.ant-select-dropdown', { state: 'visible', timeout: 5000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/06-template-dropdown-open.png' });
    console.log('   ✓ Template dropdown opened');

    // Step 7: Select first template
    console.log('\n📍 Step 7: Selecting first template...');
    const templateOptions = page.locator('.ant-select-item-option');
    const firstTemplate = templateOptions.first();
    const templateText = await firstTemplate.textContent();
    await firstTemplate.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/07-template-selected.png' });
    console.log(`   ✓ Selected template: ${templateText}`);

    // Step 8: Verify preview updated
    console.log('\n📍 Step 8: Verifying preview updated...');
    const previewTitle = page.locator('.phone-simulator h2');
    const titleText = await previewTitle.textContent();
    if (titleText === surveyName) {
      console.log('   ✓ Preview title matches survey name');
    } else {
      console.log(`   ⚠ Preview title: "${titleText}" vs Survey name: "${surveyName}"`);
    }

    // Step 9: Check if questions loaded
    console.log('\n📍 Step 9: Checking if questions loaded from template...');
    await page.waitForTimeout(1000);
    const questionsCount = await page.locator('.questions-preview .question-item').count();
    console.log(`   ✓ Template loaded with ${questionsCount} questions`);
    await page.screenshot({ path: 'screenshots/08-questions-loaded.png' });

    // Step 10: Fill description
    console.log('\n📍 Step 10: Filling survey description...');
    await page.locator('textarea.ant-input').fill('這是一個測試問卷，用於自動化測試流程');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/09-description-filled.png' });
    console.log('   ✓ Description filled');

    // Step 11: Check timezone selector
    console.log('\n📍 Step 11: Verifying timezone selector...');
    const timezoneSelect = page.locator('.ant-select-selector').nth(1);
    const timezoneText = await timezoneSelect.textContent();
    console.log(`   ✓ Timezone set to: ${timezoneText}`);

    // Step 12: Take full page screenshot
    console.log('\n📍 Step 12: Taking full page screenshot...');
    await page.screenshot({
      path: 'screenshots/10-complete-form.png',
      fullPage: true
    });
    console.log('   ✓ Full page screenshot saved');

    // Step 13: Verify all form sections
    console.log('\n📍 Step 13: Verifying form sections...');
    const sections = [
      { selector: '.phone-simulator', name: 'Phone Simulator' },
      { selector: '.ant-input', name: 'Survey Name Input' },
      { selector: '.ant-select-selector', name: 'Template Selector' },
      { selector: 'textarea.ant-input', name: 'Description Textarea' },
      { selector: 'button:has-text("儲存草稿")', name: 'Save Draft Button' },
      { selector: 'button:has-text("發布給用戶")', name: 'Publish Button' },
      { selector: 'text=基本設定', name: 'Basic Settings Section' },
      { selector: 'text=問卷內容', name: 'Survey Content Section' },
      { selector: 'text=發送設定', name: 'Send Settings Section' },
    ];

    for (const section of sections) {
      const isVisible = await page.locator(section.selector).isVisible();
      if (isVisible) {
        console.log(`   ✓ ${section.name} is visible`);
      } else {
        console.log(`   ✗ ${section.name} is NOT visible`);
      }
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Survey Creation Flow Simulation Complete!');
    console.log('='.repeat(60));
    console.log('\nScreenshots saved to: screenshots/');
    console.log('\nVerification results:');
    console.log(`  - Survey name: ${surveyName}`);
    console.log(`  - Template: ${templateText}`);
    console.log(`  - Questions loaded: ${questionsCount}`);
    console.log(`  - Timezone: ${timezoneText}`);

  } catch (error) {
    console.error('\n❌ Error during simulation:', error);
    await page.screenshot({ path: 'screenshots/error-state.png' });
  } finally {
    console.log('\n🔄 Closing browser...');
    await browser.close();
    console.log('✓ Browser closed');
  }
}

// Run the simulation
runSurveySimulation().catch(console.error);
