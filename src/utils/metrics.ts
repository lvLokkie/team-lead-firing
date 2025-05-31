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

// Подсчет количества блокеров (issues с label/blocker или статусом Blocked)
export function calcBlockers(issues: any[]): number {
  return issues.filter(i => {
    const status = (i.fields?.status?.name || '').toLowerCase();
    const labels = i.fields?.labels || [];
    return status.includes('block') || labels.some((l: string) => l.toLowerCase().includes('block'));
  }).length;
} 