import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import { TeamMetrics } from '../types/app.types';
import { useSettingsStore } from '../store/useSettingsStore';
import { getSprints, getSprintIssues, getBoards, getBurndown } from '../services/jira';
import { calcSprintProgress, calcVelocity, calcSprintHealth, calcSimpleSprintHealth } from '../utils/metrics';
import { analyzeSprintSummary } from '../services/llm';
import ReactMarkdown from 'react-markdown';

const metricDescriptions = {
  sprintProgress: 'Процент выполнения задач спринта',
  velocity: 'Velocity (часы): среднее количество оценённых часов, завершённых за спринт',
  sprintHealth: 'Sprint Health: On Track — всё по плану, Warning — есть риск, At Risk — сильно отстаём (по динамике закрытия задач)',
};

const Dashboard: React.FC = () => {
  const { settings } = useSettingsStore();
  const [loading, setLoading] = React.useState(false);
  const [metrics, setMetrics] = React.useState<{ [projectId: string]: { projectName: string; boards: { boardName: string; sprints: any[]; metrics: TeamMetrics }[] } }>({});
  const [error, setError] = React.useState<string | null>(null);
  const [sprintSummaries, setSprintSummaries] = React.useState<Record<string, string>>({});
  const [summaryLoading, setSummaryLoading] = React.useState<Record<string, boolean>>({});

  // Временные типы для mock-ответов
  type Sprint = { id: string; name: string };
  type Issue = { id: string; key: string };

  // Получить summary для активного спринта
  const fetchSprintSummary = async (sprint: any, force = false) => {
    console.log('fetchSprintSummary called', sprint);
    if (!sprint) return;
    if (sprintSummaries[sprint.id] && !force) return; // кеш
    let issues = sprint.issues;
    if (!issues) {
      // Подгружаем задачи, если их нет
      issues = await getSprintIssues(sprint.id, settings.jira);
      sprint.issues = issues;
      console.log('Задачи подгружены:', issues);
    }
    if (!issues || !settings.llm.apiKey) {
      console.log('Нет задач или нет API-ключа', { issues, apiKey: settings.llm.apiKey });
      return;
    }
    setSummaryLoading(prev => ({ ...prev, [sprint.id]: true }));
    const summary = await analyzeSprintSummary(issues, settings.llm);
    setSprintSummaries(prev => ({ ...prev, [sprint.id]: summary }));
    setSummaryLoading(prev => ({ ...prev, [sprint.id]: false }));
  };

  React.useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      try {
        // Новый формат: { [projectId]: { projectName, boards: [{ boardName, sprints, metrics }] } }
        const results: Record<string, { projectName: string; boards: { boardName: string; sprints: any[]; metrics: TeamMetrics }[] }> = {};
        for (const projectId of settings.jira.projects) {
          // Получаем список выбранных борд для проекта
          const boardIds: string[] = settings.jira.boardsByProject?.[projectId] || [];
          let boards = [];
          const allBoards = await getBoards(projectId, settings.jira);
          boards = boardIds.length > 0 ? allBoards.filter((b: any) => boardIds.includes(b.id)) : allBoards;
          const projectName = allBoards[0]?.location?.projectName || projectId;
          const boardResults: { boardName: string; sprints: any[]; metrics: TeamMetrics }[] = [];
          for (const board of boards) {
            const boardId = board.id;
            const boardName = board.name;
            let sprints = await getSprints(boardId, settings.jira);
            sprints = sprints.filter((s: any) => s.originBoardId === boardId);
            sprints = sprints.sort((a: any, b: any) => {
              const aEnd = a.endDate ? new Date(a.endDate).getTime() : 0;
              const bEnd = b.endDate ? new Date(b.endDate).getTime() : 0;
              if (aEnd && bEnd) return bEnd - aEnd;
              if (aEnd) return -1;
              if (bEnd) return 1;
              return (b.id || 0) - (a.id || 0);
            });
            const activeSprint = sprints.find((s: any) => s.state === 'active');
            let prevSprint = null;
            if (activeSprint && activeSprint.startDate) {
              // Берём последний closed спринт, у которого endDate < startDate активного
              const closedSprints = sprints.filter((s: any) => s.state === 'closed' && s.endDate);
              const activeStart = new Date(activeSprint.startDate).getTime();
              prevSprint = closedSprints
                .filter((s: any) => new Date(s.endDate).getTime() < activeStart)
                .sort((a: any, b: any) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0] || null;
            } else {
              // Если нет активного — просто последний закрытый
              prevSprint = sprints.filter((s: any) => s.state === 'closed')[0] || null;
            }
            const showSprints = [activeSprint, prevSprint].filter(Boolean);
            for (const sprint of showSprints) {
              if (sprint) {
                const issues = await getSprintIssues(sprint.id, settings.jira);
                sprint.issues = issues;
                let health = 2;
                if (sprint.startDate && sprint.endDate) {
                  health = calcSimpleSprintHealth(issues, sprint.startDate, sprint.endDate, sprint.completeDate);
                }
                sprint.metrics = {
                  sprintProgress: calcSprintProgress(issues),
                  velocity: (sprint.issues || []).reduce((a: number, i: any) => a + (i.fields?.timetracking?.originalEstimate ? parseFloat(i.fields.timetracking.originalEstimate) : 0), 0),
                  sprintHealth: health,
                };
              }
            }
            const mainSprint = activeSprint || prevSprint;
            const metrics = mainSprint && mainSprint.metrics ? mainSprint.metrics : { sprintProgress: 0, velocity: 0, sprintHealth: 0 };
            boardResults.push({ boardName, sprints: showSprints, metrics });
          }
          results[projectId] = { projectName, boards: boardResults };
        }
        setMetrics(results);
        // После загрузки метрик — авто-подгружаем summary для активных спринтов
        Object.values(results).forEach(({ boards }) => {
          boards.forEach(({ sprints }) => {
            const active = sprints.find((s: any) => s.state === 'active');
            if (
              active &&
              active.issues &&
              !sprintSummaries[active.id] && // summary ещё нет
              !summaryLoading[active.id]
            ) {
              fetchSprintSummary(active);
            }
          });
        });
      } catch (e: any) {
        setError('Ошибка загрузки метрик: ' + (e.message || e.toString()));
      } finally {
        setLoading(false);
      }
    };
    if (settings.jira.projects.length > 0) {
      fetchMetrics();
    } else {
      setMetrics({});
    }
  }, [settings.jira]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Дашборд команд
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Grid container spacing={3}>
          {Object.entries(metrics).map(([projectId, { projectName, boards }]) => (
            <Grid container key={projectId} spacing={0}>
              <Card sx={{ mb: 3, width: '100%' }}>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Проект: {projectName}
                  </Typography>
                  <Grid container spacing={2}>
                    {boards.map(({ boardName, sprints }, idx) => (
                      <Box key={boardName + idx} sx={{ width: '100%', mb: 2 }}>
                        <Card variant="outlined" sx={{ width: '100%' }}>
                          <CardContent>
                            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                              Борда: {boardName}
                            </Typography>
                            <Grid container spacing={2}>
                              {sprints.map((s: any) => (
                                <Box key={s.id} sx={{ width: { xs: '100%', md: '50%' }, display: 'inline-block', verticalAlign: 'top' }}>
                                  <Box sx={{ p: 1, border: '1px solid #eee', borderRadius: 1, m: 1 }}>
                                    <Typography variant="subtitle2">Спринт: {s.name} ({s.state})</Typography>
                                    {s.state === 'active' && (
                                      <Box sx={{ mb: 1 }}>
                                        <Typography variant="body2" color="primary">
                                          AI-описание:
                                          {summaryLoading[s.id]
                                            ? 'Генерируется...'
                                            : (
                                              sprintSummaries[s.id]
                                                ? <ReactMarkdown>{sprintSummaries[s.id]}</ReactMarkdown>
                                                : <span style={{ color: '#888' }}>Нет описания</span>
                                            )}
                                        </Typography>
                                        {!sprintSummaries[s.id] ? (
                                          <button style={{ fontSize: 12, marginTop: 4 }}
                                            onClick={() => {
                                              console.log('Клик по AI-описанию', s);
                                              fetchSprintSummary(s);
                                            }}
                                            disabled={summaryLoading[s.id]}
                                          >
                                            Сгенерировать AI-описание
                                          </button>
                                        ) : (
                                          <button style={{ fontSize: 12, marginTop: 4 }}
                                            onClick={() => {
                                              console.log('Обновить AI-описание', s);
                                              fetchSprintSummary(s, true);
                                            }}
                                            disabled={summaryLoading[s.id]}
                                          >
                                            Обновить AI-описание
                                          </button>
                                        )}
                                      </Box>
                                    )}
                                    <Typography variant="body2">Цель: {s.goal || '—'}</Typography>
                                    <Typography variant="body2">Даты: {s.startDate ? new Date(s.startDate).toLocaleDateString() : '—'} — {s.endDate ? new Date(s.endDate).toLocaleDateString() : '—'}</Typography>
                                    <Box sx={{ mt: 1 }}>
                                      <Tooltip title={metricDescriptions.sprintProgress}><span>Прогресс: {s.metrics?.sprintProgress ?? '—'}%</span></Tooltip><br />
                                      <Tooltip title={metricDescriptions.velocity}><span>Velocity: {s.metrics?.velocity ?? '—'} часов</span></Tooltip><br />
                                      <Tooltip title={metricDescriptions.sprintHealth}>
                                        <span>Sprint Health: {s.metrics?.sprintHealth === 2 ? 'On Track' : s.metrics?.sprintHealth === 1 ? 'Warning' : s.metrics?.sprintHealth === 0 ? 'At Risk' : '—'}</span>
                                      </Tooltip>
                                    </Box>
                                  </Box>
                                </Box>
                              ))}
                            </Grid>
                          </CardContent>
                        </Card>
                      </Box>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard; 