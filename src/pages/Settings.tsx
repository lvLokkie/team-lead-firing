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
  Chip,
  SelectProps,
} from '@mui/material';
import { useSettingsStore } from '../store/useSettingsStore';

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
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    updateJiraSettings({
      ...settings.jira,
      [field]: e.target.value,
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