# Test info

- Name: Settings Page >> should validate required fields
- Location: C:\Users\RaLf_\OneDrive\Документы\Cursor Projects\team-lead-firing\tests\settings.spec.ts:80:3

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toHaveAttribute(expected)

Locator: locator('[data-testid="jira-email"]')
Expected string: "true"
Received string: "false"
Call log:
  - expect.toHaveAttribute with timeout 5000ms
  - waiting for locator('[data-testid="jira-email"]')
    9 × locator resolved to <input value="" id="«r0»" required="" type="email" aria-invalid="false" data-testid="jira-email" autocomplete="username email" class="MuiInputBase-input MuiOutlinedInput-input css-16wblaj-MuiInputBase-input-MuiOutlinedInput-input"/>
      - unexpected value "false"

    at C:\Users\RaLf_\OneDrive\Документы\Cursor Projects\team-lead-firing\tests\settings.spec.ts:93:62
```

# Page snapshot

```yaml
- heading "Настройки" [level=4]
- heading "Jira" [level=6]
- text: Email
- textbox "Email"
- text: API Token
- textbox "API Token"
- text: Domain
- textbox "Domain"
- paragraph: "Например: your-domain.atlassian.net"
- button "Сохранить настройки Jira"
- heading "Notion" [level=6]
- text: API Key
- textbox "API Key"
- button "Сохранить настройки Notion"
- heading "LLM" [level=6]
- text: Provider
- combobox: OpenAI
- text: API Key
- textbox "API Key"
- button "Сохранить настройки LLM"
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Settings Page', () => {
   4 |   test.beforeEach(async ({ page }) => {
   5 |     await page.goto('/team-lead-firing/settings');
   6 |     // Ждем загрузки основного контейнера
   7 |     await page.waitForSelector('[data-testid="settings-page"]', { timeout: 5000 });
   8 |   });
   9 |
  10 |   test.afterEach(async ({ page }) => {
  11 |     // Очищаем localStorage после каждого теста
  12 |     await page.evaluate(() => localStorage.clear());
  13 |   });
  14 |
  15 |   test('should save Jira settings', async ({ page }) => {
  16 |     // Ждем и заполняем форму Jira
  17 |     await page.waitForSelector('form[data-testid="jira-form"]');
  18 |     await page.fill('[data-testid="jira-email"]', 'test@example.com');
  19 |     await page.fill('[data-testid="jira-token"]', 'jira-api-token');
  20 |     await page.fill('[data-testid="jira-domain"]', 'company.atlassian.net');
  21 |     
  22 |     await page.click('[data-testid="jira-submit"]');
  23 |
  24 |     // Проверяем localStorage
  25 |     const settings = await page.evaluate(() => {
  26 |       const data = localStorage.getItem('team-lead-settings');
  27 |       return data ? JSON.parse(data) : null;
  28 |     });
  29 |
  30 |     expect(settings.state.settings.jira).toEqual({
  31 |       email: 'test@example.com',
  32 |       apiToken: 'jira-api-token',
  33 |       domain: 'company.atlassian.net',
  34 |       projects: [],
  35 |     });
  36 |   });
  37 |
  38 |   test('should save Notion settings', async ({ page }) => {
  39 |     // Ждем и заполняем форму Notion
  40 |     await page.waitForSelector('form[data-testid="notion-form"]');
  41 |     await page.fill('[data-testid="notion-token"]', 'notion-api-key');
  42 |     
  43 |     await page.click('[data-testid="notion-submit"]');
  44 |
  45 |     // Проверяем localStorage
  46 |     const settings = await page.evaluate(() => {
  47 |       const data = localStorage.getItem('team-lead-settings');
  48 |       return data ? JSON.parse(data) : null;
  49 |     });
  50 |
  51 |     expect(settings.state.settings.notion).toEqual({
  52 |       apiKey: 'notion-api-key',
  53 |       databaseIds: [],
  54 |     });
  55 |   });
  56 |
  57 |   test('should save LLM settings', async ({ page }) => {
  58 |     // Ждем и заполняем форму LLM
  59 |     await page.waitForSelector('form[data-testid="llm-form"]');
  60 |     
  61 |     // Выбираем провайдера
  62 |     await page.click('[data-testid="llm-provider-combobox"]');
  63 |     await page.click('text=Gemini');
  64 |     
  65 |     await page.fill('[data-testid="llm-token"]', 'llm-api-key');
  66 |     await page.click('[data-testid="llm-submit"]');
  67 |
  68 |     // Проверяем localStorage
  69 |     const settings = await page.evaluate(() => {
  70 |       const data = localStorage.getItem('team-lead-settings');
  71 |       return data ? JSON.parse(data) : null;
  72 |     });
  73 |
  74 |     expect(settings.state.settings.llm).toEqual({
  75 |       provider: 'gemini',
  76 |       apiKey: 'llm-api-key',
  77 |     });
  78 |   });
  79 |
  80 |   test('should validate required fields', async ({ page }) => {
  81 |     // Ждем форму Jira
  82 |     await page.waitForSelector('form[data-testid="jira-form"]');
  83 |     
  84 |     // Пытаемся сохранить пустую форму
  85 |     await page.click('[data-testid="jira-submit"]');
  86 |     await page.click('[data-testid="jira-email"]');
  87 |     await page.click('[data-testid="jira-token"]');
  88 |     await page.click('[data-testid="jira-domain"]');
  89 |     await page.click('body'); // blur
  90 |     await page.waitForTimeout(100);
  91 |
  92 |     // Проверяем валидацию
> 93 |     await expect(page.locator('[data-testid="jira-email"]')).toHaveAttribute('aria-invalid', 'true');
     |                                                              ^ Error: Timed out 5000ms waiting for expect(locator).toHaveAttribute(expected)
  94 |     await expect(page.locator('[data-testid="jira-token"]')).toHaveAttribute('aria-invalid', 'true');
  95 |     await expect(page.locator('[data-testid="jira-domain"]')).toHaveAttribute('aria-invalid', 'true');
  96 |   });
  97 | }); 
```