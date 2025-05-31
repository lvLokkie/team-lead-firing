import React from 'react';
import { Box, Grid, Card, CardContent, Typography, Tooltip, CircularProgress } from '@mui/material';
import { TeamMetrics } from '../types/app.types';

// Моковые данные для примера
const mockMetrics: { team: string; metrics: TeamMetrics }[] = [
  {
    team: 'Alpha',
    metrics: { sprintProgress: 78, velocity: 32, sprintHealth: 85, blockers: 1 },
  },
  {
    team: 'Beta',
    metrics: { sprintProgress: 62, velocity: 28, sprintHealth: 70, blockers: 3 },
  },
];

const metricDescriptions: Record<keyof TeamMetrics, string> = {
  sprintProgress: 'Процент выполнения задач спринта',
  velocity: 'Среднее количество story points за 3 спринта',
  sprintHealth: 'Оценка здоровья спринта по burndown',
  blockers: 'Количество блокирующих задач',
};

const Dashboard: React.FC = () => {
  // TODO: заменить на загрузку из стора/сервиса
  const [loading] = React.useState(false);
  const metrics = mockMetrics;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Дашборд команд
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {metrics.map(({ team, metrics }) => (
            <Grid item xs={12} md={6} key={team}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {team}
                  </Typography>
                  <Grid container spacing={2}>
                    {Object.entries(metrics).map(([key, value]) => (
                      <Grid item xs={6} key={key}>
                        <Tooltip title={metricDescriptions[key as keyof TeamMetrics]} arrow>
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                              {metricDescriptions[key as keyof TeamMetrics]}
                            </Typography>
                            <Typography variant="h5">
                              {value}
                              {key === 'sprintProgress' || key === 'sprintHealth' ? '%' : ''}
                            </Typography>
                          </Box>
                        </Tooltip>
                      </Grid>
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