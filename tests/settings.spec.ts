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
      boardsByProject: {},
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

  test('Jira: выбор проектов и бордов, сохранение boardsByProject', async ({ page }) => {
    // Мокаем проекты
    await page.route('**/projects', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ values: [
          { id: '1', key: 'PRJ', name: 'Project 1' },
          { id: '2', key: 'PR2', name: 'Project 2' },
        ] }),
      })
    );
    // Мокаем борды для каждого проекта
    await page.route('**/boards', async route => {
      const postData = JSON.parse(route.request().postData() || '{}');
      if (postData.projectId === '1') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ values: [
            { id: 'b1', name: 'Board 1' },
            { id: 'b2', name: 'Board 2' },
          ] }),
        });
      } else if (postData.projectId === '2') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ values: [
            { id: 'b3', name: 'Board 3' },
          ] }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ values: [] }),
        });
      }
    });

    // Заполняем форму Jira
    await page.fill('[data-testid="jira-email"]', 'test@example.com');
    await page.fill('[data-testid="jira-token"]', 'jira-api-token');
    await page.fill('[data-testid="jira-domain"]', 'company.atlassian.net');

    // Ждем загрузки проектов
    await page.waitForSelector('input[placeholder="Выберите проекты"]:not([disabled])');
    // Выбираем оба проекта
    await page.click('input[placeholder="Выберите проекты"]');
    await page.click('li:has-text("Project 1")');
    await page.click('input[placeholder="Выберите проекты"]');
    await page.click('li:has-text("Project 2")');

    // Ждем появления выбора бордов для Project 1
    await page.waitForSelector('input[placeholder="Выберите борды"]');
    // Выбираем Board 1 и Board 2 для Project 1
    const boardInputs = await page.locator('input[placeholder="Выберите борды"]');
    await boardInputs.nth(0).click();
    await page.click('li:has-text("Board 1")');
    await boardInputs.nth(0).click();
    await page.click('li:has-text("Board 2")');
    // Для Project 2 выбираем Board 3
    await boardInputs.nth(1).click();
    await page.click('li:has-text("Board 3")');

    // Сохраняем настройки
    await page.click('[data-testid="jira-submit"]');

    // Проверяем localStorage
    const settings = await page.evaluate(() => {
      const data = localStorage.getItem('team-lead-settings');
      return data ? JSON.parse(data) : null;
    });
    expect(settings.state.settings.jira.boardsByProject).toEqual({
      '1': ['b1', 'b2'],
      '2': ['b3'],
    });
  });

  test('Jira: выбранные проекты и борды отображаются после перезагрузки', async ({ page }) => {
    // Мокаем проекты
    await page.route('**/projects', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ values: [
          { id: '1', key: 'PRJ', name: 'Project 1' },
          { id: '2', key: 'PR2', name: 'Project 2' },
        ] }),
      })
    );
    // Мокаем борды для каждого проекта
    await page.route('**/boards', async route => {
      const postData = JSON.parse(route.request().postData() || '{}');
      if (postData.projectId === '1') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ values: [
            { id: 'b1', name: 'Board 1' },
            { id: 'b2', name: 'Board 2' },
          ] }),
        });
      } else if (postData.projectId === '2') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ values: [
            { id: 'b3', name: 'Board 3' },
          ] }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ values: [] }),
        });
      }
    });

    // Заполняем форму Jira
    await page.fill('[data-testid="jira-email"]', 'test@example.com');
    await page.fill('[data-testid="jira-token"]', 'jira-api-token');
    await page.fill('[data-testid="jira-domain"]', 'company.atlassian.net');

    // Ждем загрузки проектов
    await page.waitForSelector('input[placeholder="Выберите проекты"]:not([disabled])');
    // Выбираем оба проекта
    await page.click('input[placeholder="Выберите проекты"]');
    await page.click('li:has-text("Project 1")');
    await page.click('input[placeholder="Выберите проекты"]');
    await page.click('li:has-text("Project 2")');

    // Ждем появления выбора бордов для Project 1
    await page.waitForSelector('input[placeholder="Выберите борды"]');
    // Выбираем Board 1 и Board 2 для Project 1
    const boardInputs = await page.locator('input[placeholder="Выберите борды"]');
    await boardInputs.nth(0).click();
    await page.click('li:has-text("Board 1")');
    await boardInputs.nth(0).click();
    await page.click('li:has-text("Board 2")');
    // Для Project 2 выбираем Board 3
    await boardInputs.nth(1).click();
    await page.click('li:has-text("Board 3")');

    // Сохраняем настройки
    await page.click('[data-testid="jira-submit"]');

    // Перезагружаем страницу
    await page.reload();

    // Моки должны быть активны и после reload (Playwright сохраняет route)
    // Проверяем, что выбранные проекты отображаются как чипы
    await expect(page.locator('span.MuiChip-label')).toContainText(['Project 1 (PRJ)', 'Project 2 (PR2)']);
    // Проверяем, что выбранные борды отображаются как чипы для каждого проекта
    const boardSections = page.locator('div:has-text("Борды для проекта")');
    const boardChipsProject1 = boardSections.nth(0).locator('span.MuiChip-label');
    const boardChipsProject2 = boardSections.nth(1).locator('span.MuiChip-label');
    await expect(boardChipsProject1).toContainText(['Board 1', 'Board 2']);
    await expect(boardChipsProject2).toContainText(['Board 3']);
  });

}); 