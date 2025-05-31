# Test info

- Name: Settings Page >> Jira projects: ручная загрузка активирует Autocomplete
- Location: C:\Users\RaLf_\OneDrive\Документы\Cursor Projects\team-lead-firing\tests\settings.spec.ts:106:3

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: locator('button:has-text("Загрузить проекты")')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('button:has-text("Загрузить проекты")')

    at C:\Users\RaLf_\OneDrive\Документы\Cursor Projects\team-lead-firing\tests\settings.spec.ts:117:26
```

# Page snapshot

```yaml
- heading "Настройки" [level=4]
- heading "Jira" [level=6]
- text: Email
- textbox "Email": test@example.com
- text: API Token
- textbox "API Token": jira-api-token
- text: Domain
- textbox "Domain": company.atlassian.net
- paragraph: "Например: your-domain.atlassian.net"
- text: Проекты Jira для отслеживания
- combobox "Проекты Jira для отслеживания"
- button "Open"
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
   80 |   test('Jira projects: кнопка появляется если не все поля заполнены', async ({ page }) => {
   81 |     await page.waitForSelector('form[data-testid="jira-form"]');
   82 |     // Заполняем только email
   83 |     await page.fill('[data-testid="jira-email"]', 'test@example.com');
   84 |     // Кнопка должна быть disabled (нет токена и домена)
   85 |     const button = await page.locator('button:has-text("Загрузить проекты")');
   86 |     await expect(button).toBeVisible();
   87 |     await expect(button).toBeDisabled();
   88 |     // Autocomplete заблокирован
   89 |     const autocomplete = await page.locator('input[placeholder="Выберите проекты"]');
   90 |     await expect(autocomplete).toBeDisabled();
   91 |   });
   92 |
   93 |   test('Jira projects: автозагрузка если все поля заполнены', async ({ page }) => {
   94 |     await page.waitForSelector('form[data-testid="jira-form"]');
   95 |     await page.fill('[data-testid="jira-email"]', 'test@example.com');
   96 |     await page.fill('[data-testid="jira-token"]', 'jira-api-token');
   97 |     await page.fill('[data-testid="jira-domain"]', 'company.atlassian.net');
   98 |     // Ждем появления Autocomplete (он должен быть активен)
   99 |     const autocomplete = await page.locator('input[placeholder="Выберите проекты"]');
  100 |     await expect(autocomplete).toBeEnabled();
  101 |     // Кнопки нет
  102 |     const button = await page.locator('button:has-text("Загрузить проекты")');
  103 |     await expect(button).toHaveCount(0);
  104 |   });
  105 |
  106 |   test('Jira projects: ручная загрузка активирует Autocomplete', async ({ page }) => {
  107 |     await page.waitForSelector('form[data-testid="jira-form"]');
  108 |     await page.fill('[data-testid="jira-email"]', 'test@example.com');
  109 |     await page.fill('[data-testid="jira-token"]', 'jira-api-token');
  110 |     // Не заполняем domain сразу!
  111 |     const autocomplete = await page.locator('input[placeholder="Выберите проекты"]');
  112 |     await expect(autocomplete).toBeDisabled();
  113 |     // Заполняем domain
  114 |     await page.fill('[data-testid="jira-domain"]', 'company.atlassian.net');
  115 |     // Явно ждем появления кнопки
  116 |     const button = await page.locator('button:has-text("Загрузить проекты")');
> 117 |     await expect(button).toBeVisible();
      |                          ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
  118 |     await expect(button).toBeEnabled();
  119 |     await button.click();
  120 |     // После загрузки Autocomplete становится активным
  121 |     await expect(autocomplete).toBeEnabled();
  122 |   });
  123 | }); 
```