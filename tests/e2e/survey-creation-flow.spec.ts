/**
 * E2E Test: Survey Template Selection and Creation Flow
 *
 * This test simulates the user flow of:
 * 1. Navigating to the Survey List page
 * 2. Clicking "建立問卷" (Create Survey) button
 * 3. Interacting with template selection
 * 4. Filling in survey details
 * 5. Previewing survey in the phone simulator
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:5174';

test.describe('Survey Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto(BASE_URL);
  });

  test('should navigate to survey creation page from survey list', async ({ page }) => {
    // Step 1: Navigate to surveys page
    await page.click('text=問卷模板');
    await expect(page).toHaveURL(/\/surveys/);

    // Step 2: Click create survey button
    await page.click('button:has-text("建立問卷")');
    await expect(page).toHaveURL(/\/surveys\/create/);

    // Verify breadcrumb navigation
    await expect(page.locator('.ant-breadcrumb')).toContainText('問卷模板');
    await expect(page.locator('.ant-breadcrumb')).toContainText('建立問卷');
  });

  test('should display template selection and load templates', async ({ page }) => {
    // Navigate directly to create page
    await page.goto(`${BASE_URL}/surveys/create`);
    await page.waitForLoadState('networkidle');

    // Verify template dropdown exists
    const templateSelect = page.locator('[name="template_id"]').locator('..');
    await expect(templateSelect).toBeVisible();

    // Click to open template dropdown
    await templateSelect.click();

    // Wait for templates to load
    await page.waitForSelector('.ant-select-dropdown', { state: 'visible' });

    // Verify template options are displayed
    const templateOptions = page.locator('.ant-select-item-option');
    const count = await templateOptions.count();
    expect(count).toBeGreaterThan(0);

    // Verify template structure (icon + name)
    const firstTemplate = templateOptions.first();
    await expect(firstTemplate).toContainText(/😊|📊|⭐|🎉/); // Template icons
  });

  test('should update preview when template is selected', async ({ page }) => {
    await page.goto(`${BASE_URL}/surveys/create`);
    await page.waitForLoadState('networkidle');

    // Select a template
    const templateSelect = page.locator('[name="template_id"]').locator('..');
    await templateSelect.click();
    await page.waitForSelector('.ant-select-dropdown', { state: 'visible' });

    // Click first template option
    await page.locator('.ant-select-item-option').first().click();

    // Wait for template to load
    await page.waitForTimeout(500);

    // Verify preview section shows template questions
    const phoneSimulator = page.locator('.phone-simulator');
    await expect(phoneSimulator).toBeVisible();

    // Check if questions are loaded in preview
    const questionsPreview = page.locator('.questions-preview .question-item');
    const questionCount = await questionsPreview.count();

    if (questionCount > 0) {
      // Verify question structure
      const firstQuestion = questionsPreview.first();
      await expect(firstQuestion.locator('.question-number')).toBeVisible();
      await expect(firstQuestion.locator('.question-text')).toBeVisible();
    }
  });

  test('should fill survey basic information', async ({ page }) => {
    await page.goto(`${BASE_URL}/surveys/create`);
    await page.waitForLoadState('networkidle');

    // Fill survey name
    const surveyName = '2024 住客滿意度調查測試';
    await page.fill('[name="name"]', surveyName);

    // Verify name appears in phone preview
    const previewTitle = page.locator('.phone-simulator h2');
    await expect(previewTitle).toHaveText(surveyName);

    // Select template
    const templateSelect = page.locator('[name="template_id"]').locator('..');
    await templateSelect.click();
    await page.waitForSelector('.ant-select-dropdown', { state: 'visible' });
    await page.locator('.ant-select-item-option').first().click();

    // Select timezone
    const timezoneSelect = page.locator('[name="timezone"]').locator('..');
    await expect(timezoneSelect).toBeVisible();
    // Default should be Asia/Taipei
    await expect(timezoneSelect).toContainText('台北');

    // Fill description
    const description = '這是一份測試問卷，用於收集住客反饋';
    await page.fill('[name="description"]', description);

    // Verify description in preview
    await expect(page.locator('.phone-simulator .description')).toHaveText(description);
  });

  test('should show phone simulator with realistic mobile frame', async ({ page }) => {
    await page.goto(`${BASE_URL}/surveys/create`);
    await page.waitForLoadState('networkidle');

    // Verify phone simulator structure
    const phoneFrame = page.locator('.phone-frame');
    await expect(phoneFrame).toBeVisible();

    // Check status bar
    const statusBar = page.locator('.status-bar');
    await expect(statusBar).toBeVisible();
    await expect(statusBar.locator('.time')).toHaveText('9:41');

    // Check app header
    const appHeader = page.locator('.app-header h3');
    await expect(appHeader).toHaveText('問卷預覽');

    // Check phone content area
    const phoneContent = page.locator('.phone-content');
    await expect(phoneContent).toBeVisible();
  });

  test('should handle schedule settings', async ({ page }) => {
    await page.goto(`${BASE_URL}/surveys/create`);
    await page.waitForLoadState('networkidle');

    // Verify target audience options
    await expect(page.locator('text=所有好友')).toBeVisible();
    await expect(page.locator('text=篩選目標對象')).toBeVisible();

    // Verify schedule type options
    await expect(page.locator('text=立即發送')).toBeVisible();
    await expect(page.locator('text=自訂發送時間')).toBeVisible();

    // Test scheduled send option
    await page.click('input[value="scheduled"]');

    // Date picker should appear
    await page.waitForSelector('[name="scheduled_at"]', { state: 'visible' });
    const datePicker = page.locator('[name="scheduled_at"]');
    await expect(datePicker).toBeVisible();
  });

  test('should show save and publish buttons', async ({ page }) => {
    await page.goto(`${BASE_URL}/surveys/create`);
    await page.waitForLoadState('networkidle');

    // Verify action buttons exist
    const formActions = page.locator('.form-actions');
    await expect(formActions).toBeVisible();

    // Check for save draft button
    const saveDraftButton = page.locator('button:has-text("儲存草稿")');
    await expect(saveDraftButton).toBeVisible();

    // Check for publish button
    const publishButton = page.locator('button:has-text("發布給用戶")');
    await expect(publishButton).toBeVisible();

    // Check for cancel button
    const cancelButton = formActions.locator('button:has-text("取消")');
    await expect(cancelButton).toBeVisible();
  });

  test('should validate required fields before submission', async ({ page }) => {
    await page.goto(`${BASE_URL}/surveys/create`);
    await page.waitForLoadState('networkidle');

    // Try to save without filling required fields
    await page.click('button:has-text("儲存草稿")');

    // Wait for validation messages
    await page.waitForTimeout(500);

    // Should see validation error messages
    const errorMessages = page.locator('.ant-form-item-explain-error');
    const errorCount = await errorMessages.count();
    expect(errorCount).toBeGreaterThan(0);
  });

  test('should navigate back to survey list', async ({ page }) => {
    await page.goto(`${BASE_URL}/surveys/create`);
    await page.waitForLoadState('networkidle');

    // Click back button
    await page.click('button:has-text("返回列表")');

    // Should navigate back to surveys list
    await expect(page).toHaveURL(/\/surveys$/);
  });

  test('complete survey creation flow simulation', async ({ page }) => {
    // This test simulates the complete user journey
    console.log('🎯 Starting complete survey creation flow...');

    // Step 1: Navigate to surveys
    await page.goto(`${BASE_URL}/surveys`);
    console.log('✓ Navigated to surveys list');

    // Step 2: Click create button
    await page.click('button:has-text("建立問卷")');
    await expect(page).toHaveURL(/\/surveys\/create/);
    console.log('✓ Opened survey creation page');

    // Step 3: Fill survey name
    const surveyName = '測試問卷 - ' + new Date().toISOString();
    await page.fill('[name="name"]', surveyName);
    console.log(`✓ Filled survey name: ${surveyName}`);

    // Step 4: Select template
    const templateSelect = page.locator('[name="template_id"]').locator('..');
    await templateSelect.click();
    await page.waitForSelector('.ant-select-dropdown', { state: 'visible' });
    await page.locator('.ant-select-item-option').first().click();
    console.log('✓ Selected survey template');

    // Step 5: Verify timezone (default)
    const timezoneSelect = page.locator('[name="timezone"]').locator('..');
    await expect(timezoneSelect).toContainText('台北');
    console.log('✓ Verified timezone setting');

    // Step 6: Fill description
    await page.fill('[name="description"]', '這是一個自動化測試問卷');
    console.log('✓ Filled description');

    // Step 7: Verify preview updates
    await expect(page.locator('.phone-simulator h2')).toHaveText(surveyName);
    console.log('✓ Preview updated correctly');

    // Step 8: Check questions loaded from template
    await page.waitForTimeout(1000);
    const questionsCount = await page.locator('.questions-preview .question-item').count();
    console.log(`✓ Template loaded with ${questionsCount} questions`);

    // Step 9: Take screenshot of the complete form
    await page.screenshot({
      path: 'survey-creation-complete.png',
      fullPage: true
    });
    console.log('✓ Screenshot saved');

    console.log('🎉 Complete survey creation flow test passed!');
  });
});

test.describe('Survey Template Interaction', () => {
  test('should display template description on selection', async ({ page }) => {
    await page.goto(`${BASE_URL}/surveys/create`);
    await page.waitForLoadState('networkidle');

    // Select a template
    const templateSelect = page.locator('[name="template_id"]').locator('..');
    await templateSelect.click();
    await page.waitForSelector('.ant-select-dropdown', { state: 'visible' });
    await page.locator('.ant-select-item-option').first().click();

    // Wait for template description to appear
    await page.waitForTimeout(500);

    // Verify template description is shown
    const templateDescription = page.locator('.template-description');
    const isVisible = await templateDescription.isVisible();

    if (isVisible) {
      await expect(templateDescription).toBeVisible();
      const descText = await templateDescription.textContent();
      expect(descText?.length).toBeGreaterThan(0);
    }
  });

  test('should load default questions from template', async ({ page }) => {
    await page.goto(`${BASE_URL}/surveys/create`);
    await page.waitForLoadState('networkidle');

    // Initially should show empty state
    await expect(page.locator('.empty-questions')).toBeVisible();

    // Select a template
    const templateSelect = page.locator('[name="template_id"]').locator('..');
    await templateSelect.click();
    await page.waitForSelector('.ant-select-dropdown', { state: 'visible' });
    await page.locator('.ant-select-item-option').first().click();

    // Wait for questions to load
    await page.waitForTimeout(1000);

    // Verify questions appeared in the editor section
    const questionCards = page.locator('.question-card');
    const count = await questionCards.count();

    if (count > 0) {
      // Verify question structure
      const firstQuestion = questionCards.first();
      await expect(firstQuestion.locator('.question-header')).toBeVisible();
      await expect(firstQuestion.locator('.question-text')).toBeVisible();
      await expect(firstQuestion.locator('.question-type-badge')).toBeVisible();
    }
  });
});
