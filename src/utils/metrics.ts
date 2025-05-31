// Расчет Sprint Progress (% завершённых задач)
export function calcSprintProgress(issues: any[]): number {
  if (!issues.length) return 0;
  const doneStatuses = ['done', 'closed', 'resolved', 'Готово', 'Выполнено'];
  const done = issues.filter(i => doneStatuses.includes((i.fields?.status?.name || '').toLowerCase())).length;
  return Math.round((done / issues.length) * 100);
}

// Расчет Velocity (среднее story points за 3 последних спринта)
export function calcVelocity(sprints: any[]): number {
  if (!sprints.length) return 0;
  // Ожидается, что у спринта есть поле completedIssuesEstimateSum.value (Jira Agile API)
  const last3 = sprints.slice(-3);
  const sum = last3.reduce((acc, s) => acc + (s.completedIssuesEstimateSum?.value || 0), 0);
  return Math.round(sum / last3.length);
}

// Расчет Sprint Health (stub)
export function calcSprintHealth(_burndown: any): number {
  // Требует отдельного запроса к Jira (burndown chart)
  return 0;
}

// Простой расчет Sprint Health
// Возвращает: 2 — On Track, 1 — Warning, 0 — At Risk
export function calcSimpleSprintHealth(issues: any[], startDate: string, endDate: string, now?: string): number {
  if (!startDate || !endDate || !issues.length) return 2;
  const doneStatuses = ['done', 'closed', 'resolved', 'Готово', 'Выполнено'];
  const done = issues.filter(i => doneStatuses.includes((i.fields?.status?.name || '').toLowerCase())).length;
  const total = issues.length;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const current = now ? new Date(now).getTime() : Date.now();
  const mid = start + (end - start) / 2;
  const progress = done / total;
  if (current < mid) {
    // Первая половина спринта
    if (progress < 0.3) return 0; // At Risk
    return 2; // On Track
  } else if (current < end) {
    // Вторая половина спринта
    if (progress < 0.8) return 1; // Warning
    return 2; // On Track
  } else {
    // Спринт завершён
    if (progress < 1) return 1; // Warning (не всё завершено)
    return 2; // On Track
  }
} 