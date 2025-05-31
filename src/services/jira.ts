// Мок-сервис для получения проектов Jira
import { JiraProject } from '../types/jira.types';

const PROXY_URL = import.meta.env.VITE_PROXY_URL;

export async function getProjects({ email, apiToken, domain }: { email: string; apiToken: string; domain: string; }): Promise<JiraProject[]> {
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, apiToken, domain }),
  });
  if (!res.ok) throw new Error('Ошибка загрузки проектов Jira');
  const data = await res.json();
  // data.values — массив проектов
  return (data.values || []).map((p: any) => ({
    id: p.id,
    key: p.key,
    name: p.name,
  }));
} 