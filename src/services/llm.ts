export async function analyzeSprintSummary(issues: any[], settings: { provider: string; apiKey: string }): Promise<string> {
  // Новый промт: сгруппировать задачи по темам и выдать только список изменений
  const prompt = `Сделай краткое описание ключевых изменений команды разработки за спринт на основе summary этих задач, предварительно сгруппировав их по темам (ничего кроме списка изменений в ответе не нужно):\n${issues.map(i => `- ${i.fields?.summary || i.key}`).join('\n')}`;
  // Пример запроса к локальному API (можно заменить на прямой вызов OpenAI и т.д.)
  const res = await fetch('/api/llm-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.apiKey}` },
    body: JSON.stringify({ provider: settings.provider, prompt }),
  });
  if (!res.ok) return 'Не удалось получить описание';
  const data = await res.json();
  return data.summary || 'Нет данных';
} 