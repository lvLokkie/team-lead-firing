const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/jira/projects', async (req, res) => {
  const { email, apiToken, domain } = req.body;
  const url = `https://${domain}/rest/api/3/project/search`;
  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка прокси или Jira API' });
  }
});

app.post('/api/jira/sprints', async (req, res) => {
  const { email, apiToken, domain, boardId } = req.body;
  const url = `https://${domain}/rest/agile/1.0/board/${boardId}/sprint`;
  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка прокси или Jira API' });
  }
});

app.post('/api/jira/sprint-issues', async (req, res) => {
  const { email, apiToken, domain, sprintId } = req.body;
  const url = `https://${domain}/rest/agile/1.0/sprint/${sprintId}/issue`;
  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка прокси или Jira API' });
  }
});

app.post('/api/jira/boards', async (req, res) => {
  const { email, apiToken, domain, projectId } = req.body;
  const url = `https://${domain}/rest/agile/1.0/board?projectKeyOrId=${projectId}`;
  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    console.error('Jira boards error:', e);
    res.status(500).json({ error: 'Ошибка прокси или Jira API' });
  }
});

app.post('/api/jira/burndown', async (req, res) => {
  const { email, apiToken, domain, rapidViewId, sprintId } = req.body;
  const url = `https://${domain}/rest/agile/1.0/rapid/charts/burndownchart?rapidViewId=${rapidViewId}&sprintId=${sprintId}`;
  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка прокси или Jira API' });
  }
});

app.post('/api/llm-summary', async (req, res) => {
  const { provider, prompt, apiKey } = req.body;
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) return res.status(400).json({ summary: 'Нет API ключа для LLM' });
  try {
    if (provider === 'openai' || !provider) {
      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'Ты помогаешь тимлиду. Пиши кратко и по делу.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 300,
          temperature: 0.4,
        }),
      });
      const data = await openaiRes.json();
      const summary = data.choices?.[0]?.message?.content?.trim() || 'Нет данных';
      return res.json({ summary });
    }
    // Можно добавить другие провайдеры (Gemini, Google AI)
    return res.json({ summary: 'Провайдер не поддерживается' });
  } catch (e) {
    return res.status(500).json({ summary: 'Ошибка LLM: ' + (e.message || e.toString()) });
  }
});

app.listen(3001, () => console.log('Proxy running on http://tlf.ai:3001')); 