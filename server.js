import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

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

app.listen(3001, () => console.log('Proxy running on http://tlf.ai:3001')); 