# Team Lead Assistant

Веб-приложение для автоматизации работы тим-лида с интеграцией Jira, Notion и LLM.

## Функциональность

- Интеграция с Jira API для отслеживания прогресса команд
- Интеграция с Notion для ведения документации и отчетов
- Использование LLM для анализа данных и генерации отчетов
- Визуализация метрик команд
- Автоматическая генерация отчетов по спринтам

## Технологии

- React 18 + TypeScript
- Vite
- Material-UI v5
- React Router v6
- Recharts
- Zustand
- React Query
- Axios

## Установка

1. Клонируйте репозиторий
```bash
git clone https://github.com/your-username/team-lead-firing.git
cd team-lead-firing
```

2. Установите зависимости
```bash
npm install
```

3. Запустите приложение в режиме разработки
```bash
npm run dev
```

## Настройка

1. Получите API токен Jira
2. Создайте интеграцию в Notion и получите API ключ
3. Получите API ключ выбранного LLM провайдера
4. Введите все ключи в настройках приложения

## Деплой

Приложение автоматически деплоится на GitHub Pages при пуше в ветку main.
