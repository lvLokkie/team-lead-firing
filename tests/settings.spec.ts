import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/team-lead-firing/settings');
    // Ждем загрузки основного контейнера
    await page.waitForSelector('[data-testid="settings-page"]', { timeout: 5000 });
  });

  test.afterEach(async ({ page }) => {
    // Очищаем localStorage после каждого теста
    await page.evaluate(() => localStorage.clear());
  });

  test('should save Jira settings', async ({ page }) => {
    // Ждем и заполняем форму Jira
    await page.waitForSelector('form[data-testid="jira-form"]');
    await page.fill('[data-testid="jira-email"]', 'test@example.com');
    await page.fill('[data-testid="jira-token"]', 'jira-api-token');
    await page.fill('[data-testid="jira-domain"]', 'company.atlassian.net');
    
    await page.click('[data-testid="jira-submit"]');

    // Проверяем localStorage
    const settings = await page.evaluate(() => {
      const data = localStorage.getItem('team-lead-settings');
      return data ? JSON.parse(data) : null;
    });

    expect(settings.state.settings.jira).toEqual({
      email: 'test@example.com',
      apiToken: 'jira-api-token',
      domain: 'company.atlassian.net',
      projects: [],
    });
  });

  test('should save Notion settings', async ({ page }) => {
    // Ждем и заполняем форму Notion
    await page.waitForSelector('form[data-testid="notion-form"]');
    await page.fill('[data-testid="notion-token"]', 'notion-api-key');
    
    await page.click('[data-testid="notion-submit"]');

    // Проверяем localStorage
    const settings = await page.evaluate(() => {
      const data = localStorage.getItem('team-lead-settings');
      return data ? JSON.parse(data) : null;
    });

    expect(settings.state.settings.notion).toEqual({
      apiKey: 'notion-api-key',
      databaseIds: [],
    });
  });

  test('should save LLM settings', async ({ page }) => {
    // Ждем и заполняем форму LLM
    await page.waitForSelector('form[data-testid="llm-form"]');
    
    // Выбираем провайдера
    await page.click('[data-testid="llm-provider-combobox"]');
    await page.click('text=Gemini');
    
    await page.fill('[data-testid="llm-token"]', 'llm-api-key');
    await page.click('[data-testid="llm-submit"]');

    // Проверяем localStorage
    const settings = await page.evaluate(() => {
      const data = localStorage.getItem('team-lead-settings');
      return data ? JSON.parse(data) : null;
    });

    expect(settings.state.settings.llm).toEqual({
      provider: 'gemini',
      apiKey: 'llm-api-key',
    });
  });

  test('Jira projects: кнопка появляется если не все поля заполнены', async ({ page }) => {
    await page.waitForSelector('form[data-testid="jira-form"]');
    // Заполняем только email
    await page.fill('[data-testid="jira-email"]', 'test@example.com');
    // Кнопка должна быть disabled (нет токена и домена)
    const button = await page.locator('button:has-text("Загрузить проекты")');
    await expect(button).toBeVisible();
    await expect(button).toBeDisabled();
    // Autocomplete заблокирован
    const autocomplete = await page.locator('input[placeholder="Выберите проекты"]');
    await expect(autocomplete).toBeDisabled();
  });

  test('Jira projects: автозагрузка если все поля заполнены', async ({ page }) => {
    await page.waitForSelector('form[data-testid="jira-form"]');
    await page.fill('[data-testid="jira-email"]', 'test@example.com');
    await page.fill('[data-testid="jira-token"]', 'jira-api-token');
    await page.fill('[data-testid="jira-domain"]', 'company.atlassian.net');
    // Ждем появления Autocomplete (он должен быть активен)
    const autocomplete = await page.locator('input[placeholder="Выберите проекты"]');
    await expect(autocomplete).toBeEnabled();
    // Кнопки нет
    const button = await page.locator('button:has-text("Загрузить проекты")');
    await expect(button).toHaveCount(0);
  });

}); 