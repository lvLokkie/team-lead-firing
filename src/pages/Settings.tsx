import React from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Stack,
  SelectProps,
} from '@mui/material';
import { useSettingsStore } from '../store/useSettingsStore';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import { getProjects, getBoards } from '../services/jira';
import { JiraProject } from '../types/jira.types';

type JiraBoard = { id: string; name: string };

// Расширяем тип пропсов для Select
const CustomSelect = (props: SelectProps) => (
  <Select
    {...props}
    inputProps={{
      ...props.inputProps,
      autoComplete: 'off',
    }}
  />
);

export const Settings: React.FC = () => {
  const { settings, updateJiraSettings, updateNotionSettings, updateLLMSettings } =
    useSettingsStore();

  // Состояния ошибок для каждой формы
  const [jiraErrors, setJiraErrors] = React.useState({ email: false, apiToken: false, domain: false });
  const [notionErrors, setNotionErrors] = React.useState({ apiKey: false });
  const [llmErrors, setLlmErrors] = React.useState({ provider: false, apiKey: false });

  // --- State for Jira projects ---
  const [projects, setProjects] = React.useState<JiraProject[]>([]);
  const [loadingProjects, setLoadingProjects] = React.useState(false);
  const [projectsError, setProjectsError] = React.useState<string | null>(null);
  const [projectsLoaded, setProjectsLoaded] = React.useState(false);

  const [boardsByProject, setBoardsByProject] = React.useState<Record<string, { boards: JiraBoard[]; loading: boolean; error: string | null }>>({});

  const loadProjects = async () => {
    setLoadingProjects(true);
    setProjectsError(null);
    try {
      const data = await getProjects({
        email: settings.jira.email,
        apiToken: settings.jira.apiToken,
        domain: settings.jira.domain,
      });
      setProjects(data);
      setProjectsLoaded(true);
    } catch {
      setProjectsError('Ошибка загрузки проектов Jira');
      setProjects([]);
      setProjectsLoaded(false);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleJiraSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJiraErrors({
      email: !settings.jira.email,
      apiToken: !settings.jira.apiToken,
      domain: !settings.jira.domain,
    });
    // В будущем здесь можно добавить тестирование подключения
  };

  const handleNotionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotionErrors({
      apiKey: !settings.notion.apiKey,
    });
  };

  const handleLLMSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLlmErrors({
      provider: !settings.llm.provider,
      apiKey: !settings.llm.apiKey,
    });
  };

  const handleJiraChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<{ value: unknown }> | any
  ) => {
    const value = e.target?.value ?? '';
    updateJiraSettings({
      ...settings.jira,
      [field]: value,
    });
    setJiraErrors((prev) => ({ ...prev, [field]: false }));
  };

  const handleNotionChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    updateNotionSettings({
      ...settings.notion,
      [field]: e.target.value,
    });
    setNotionErrors((prev) => ({ ...prev, [field]: false }));
  };

  const handleLLMChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | { value: unknown }>
  ) => {
    updateLLMSettings({
      ...settings.llm,
      [field]: e.target.value,
    });
    setLlmErrors((prev) => ({ ...prev, [field]: false }));
  };

  const handleProjectsChange = (_: React.SyntheticEvent, value: JiraProject[]) => {
    updateJiraSettings({
      ...settings.jira,
      projects: value.map((p) => p.id),
    });
  };

  // Загружаем борды для выбранных проектов
  React.useEffect(() => {
    const fetchBoards = async (projectId: string) => {
      setBoardsByProject((prev) => ({
        ...prev,
        [projectId]: { boards: [], loading: true, error: null },
      }));
      try {
        const boards = await getBoards(projectId, {
          email: settings.jira.email,
          apiToken: settings.jira.apiToken,
          domain: settings.jira.domain,
        });
        setBoardsByProject((prev) => ({
          ...prev,
          [projectId]: { boards, loading: false, error: null },
        }));
      } catch {
        setBoardsByProject((prev) => ({
          ...prev,
          [projectId]: { boards: [], loading: false, error: 'Ошибка загрузки бордов' },
        }));
      }
    };
    settings.jira.projects.forEach((projectId) => {
      if (!boardsByProject[projectId]) fetchBoards(projectId);
    });
  }, [settings.jira.projects, settings.jira.email, settings.jira.apiToken, settings.jira.domain]);

  const handleBoardsChange = (projectId: string, value: JiraBoard[]) => {
    updateJiraSettings({
      ...settings.jira,
      boardsByProject: {
        ...settings.jira.boardsByProject,
        [projectId]: value.map((b) => b.id),
      },
    });
  };

  React.useEffect(() => {
    if (
      settings.jira.email &&
      settings.jira.apiToken &&
      settings.jira.domain &&
      !projectsLoaded &&
      !loadingProjects
    ) {
      loadProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.jira.email, settings.jira.apiToken, settings.jira.domain]);

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }} data-testid="settings-page">
      <Typography variant="h4" gutterBottom>
        Настройки
      </Typography>

      <Stack spacing={3}>
        {/* Jira Settings */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Jira
            </Typography>
            <form onSubmit={handleJiraSubmit} autoComplete="off" data-testid="jira-form">
              <Stack spacing={2}>
                <TextField
                  label="Email"
                  value={settings.jira.email}
                  onChange={handleJiraChange('email')}
                  fullWidth
                  required
                  type="email"
                  autoComplete="username email"
                  inputProps={{
                    autoComplete: 'username email',
                    'data-testid': 'jira-email',
                  }}
                  error={jiraErrors.email}
                />
                <TextField
                  label="API Token"
                  type="password"
                  value={settings.jira.apiToken}
                  onChange={handleJiraChange('apiToken')}
                  fullWidth
                  required
                  autoComplete="current-password"
                  inputProps={{
                    autoComplete: 'current-password',
                    'data-testid': 'jira-token',
                  }}
                  error={jiraErrors.apiToken}
                />
                <TextField
                  label="Domain"
                  value={settings.jira.domain}
                  onChange={handleJiraChange('domain')}
                  fullWidth
                  required
                  helperText="Например: your-domain.atlassian.net"
                  autoComplete="url"
                  inputProps={{
                    autoComplete: 'url',
                    'data-testid': 'jira-domain',
                  }}
                  error={jiraErrors.domain}
                />
                {(!settings.jira.email || !settings.jira.apiToken || !settings.jira.domain || !projectsLoaded) && (
                  <Button
                    variant="outlined"
                    onClick={loadProjects}
                    disabled={loadingProjects || !settings.jira.email || !settings.jira.apiToken || !settings.jira.domain}
                    sx={{ mb: 1 }}
                  >
                    {loadingProjects ? 'Загрузка...' : 'Загрузить проекты'}
                  </Button>
                )}
                <Autocomplete
                  multiple
                  options={projects}
                  getOptionLabel={(option) => option.name + ' (' + option.key + ')'}
                  value={projects.filter((p) => settings.jira.projects.includes(p.id))}
                  onChange={handleProjectsChange}
                  loading={loadingProjects}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled={!projectsLoaded}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Проекты Jira для отслеживания"
                      placeholder="Выберите проекты"
                      error={!!projectsError}
                      helperText={projectsError || (!projectsLoaded ? 'Сначала загрузите проекты' : undefined)}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingProjects ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
                {settings.jira.projects.map((projectId) => {
                  const project = projects.find((p) => p.id === projectId);
                  const boardsState = boardsByProject[projectId] || { boards: [], loading: false, error: null };
                  return (
                    <Box key={projectId} sx={{ mt: 2, mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Борды для проекта {project?.name || projectId}
                      </Typography>
                      <Autocomplete<JiraBoard, true, false, false>
                        multiple
                        options={boardsState.boards}
                        getOptionLabel={(option) => option.name}
                        value={boardsState.boards.filter((b) => (settings.jira.boardsByProject?.[projectId] || []).includes(b.id))}
                        onChange={(_, value) => handleBoardsChange(projectId, value)}
                        loading={boardsState.loading}
                        isOptionEqualToValue={(o, v) => o.id === v.id}
                        disabled={boardsState.loading}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Борды для отслеживания"
                            placeholder="Выберите борды"
                            error={!!boardsState.error}
                            helperText={boardsState.error}
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {boardsState.loading ? <CircularProgress color="inherit" size={20} /> : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                      />
                    </Box>
                  );
                })}
                <Button type="submit" variant="contained" color="primary" data-testid="jira-submit">
                  Сохранить настройки Jira
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>

        {/* Notion Settings */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Notion
            </Typography>
            <form onSubmit={handleNotionSubmit} autoComplete="off" data-testid="notion-form">
              <Stack spacing={2}>
                <input
                  type="text"
                  autoComplete="username"
                  style={{ display: 'none' }}
                  aria-hidden="true"
                />
                <TextField
                  label="API Key"
                  type="password"
                  value={settings.notion.apiKey}
                  onChange={handleNotionChange('apiKey')}
                  fullWidth
                  required
                  autoComplete="current-password"
                  inputProps={{
                    autoComplete: 'current-password',
                    'data-testid': 'notion-token',
                  }}
                  error={notionErrors.apiKey}
                />
                <Button type="submit" variant="contained" color="primary" data-testid="notion-submit">
                  Сохранить настройки Notion
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>

        {/* LLM Settings */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              LLM
            </Typography>
            <form onSubmit={handleLLMSubmit} autoComplete="off" data-testid="llm-form">
              <Stack spacing={2}>
                <input
                  type="text"
                  autoComplete="username"
                  style={{ display: 'none' }}
                  aria-hidden="true"
                />
                <FormControl fullWidth required>
                  <InputLabel>Provider</InputLabel>
                  <CustomSelect
                    value={settings.llm.provider}
                    label="Provider"
                    onChange={handleLLMChange('provider')}
                    data-testid="llm-provider-combobox"
                    inputProps={{
                      'data-testid': 'llm-provider',
                    }}
                    error={llmErrors.provider}
                  >
                    <MenuItem value="openai">OpenAI</MenuItem>
                    <MenuItem value="gemini">Gemini</MenuItem>
                    <MenuItem value="google">Google AI</MenuItem>
                  </CustomSelect>
                </FormControl>
                <TextField
                  label="API Key"
                  type="password"
                  value={settings.llm.apiKey}
                  onChange={handleLLMChange('apiKey')}
                  fullWidth
                  required
                  autoComplete="current-password"
                  inputProps={{
                    autoComplete: 'current-password',
                    'data-testid': 'llm-token',
                  }}
                  error={llmErrors.apiKey}
                />
                <Button type="submit" variant="contained" color="primary" data-testid="llm-submit">
                  Сохранить настройки LLM
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}; 