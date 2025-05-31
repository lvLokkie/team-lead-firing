// Мок-сервис для получения проектов Jira
import { JiraProject } from '../types/jira.types';

const PROXY_URL = import.meta.env.VITE_PROXY_URL;

export async function getProjects({ email, apiToken, domain }: { email: string; apiToken: string; domain: string; }): Promise<JiraProject[]> {
  const res = await fetch(`${PROXY_URL}/projects`, {
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

// Получить доски по projectId
export async function getBoards(projectId: string, auth: { email: string; apiToken: string; domain: string; }) {
  const res = await fetch(`${PROXY_URL}/boards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...auth, projectId }),
  });
  if (!res.ok) throw new Error('Ошибка загрузки досок Jira');
  const data = await res.json();
  return data.values || [];
}

// Получить burndown по rapidViewId и sprintId
export async function getBurndown(rapidViewId: string, sprintId: string, auth: { email: string; apiToken: string; domain: string; }) {
  const res = await fetch(`${PROXY_URL}/burndown`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...auth, rapidViewId, sprintId }),
  });
  if (!res.ok) throw new Error('Ошибка загрузки burndown Jira');
  return await res.json();
}

// Получить спринты по boardId
export async function getSprints(boardId: string, auth: { email: string; apiToken: string; domain: string; }) {
  const res = await fetch(`${PROXY_URL}/sprints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...auth, boardId }),
  });
  if (!res.ok) throw new Error('Ошибка загрузки спринтов Jira');
  const data = await res.json();
  // data.values — массив спринтов
  return data.values || [];
}

// Получить задачи спринта
export async function getSprintIssues(sprintId: string, auth: { email: string; apiToken: string; domain: string; }) {
  const res = await fetch(`${PROXY_URL}/sprint-issues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...auth, sprintId }),
  });
  if (!res.ok) throw new Error('Ошибка загрузки задач спринта Jira');
  const data = await res.json();
  // data.issues — массив задач
  return data.issues || [];
} 