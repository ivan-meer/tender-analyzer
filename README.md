# Tender Analyzer — Анализатор тендерной документации

AI-ассистент для анализа закупок по 44-ФЗ, 223-ФЗ и коммерческих торгов. Извлекает риски из проектов договоров, сверяет спецификацию с ТЗ, проверяет соблюдение национального режима (ПП РФ № 1875) и генерирует шаблоны документов.

## Быстрый старт

```bash
npm install
cp .env.example .env  # заполните ключи
npm run dev           # → http://localhost:3000
```

### Переменные окружения

| Переменная | Зачем |
|---|---|
| `GEMINI_API_KEY` | Основной LLM-провайдер (Gemini 2.5 Flash) |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `MISTRAL_API_KEY` | OCR для сканов документов |
| `OPENAI_API_KEY` | Опционально, для OpenAI/Mistral |

## Возможности

- **Анализ договора**: AI сканирует проект договора, документацию и ТЗ, выдаёт риск-скор (0-100), подсвечивает кабальные пункты.
- **Реестр рисков**: CRITICAL/HIGH/MEDIUM риски с цитатами пунктов и рекомендациями. Поддержка сравнения версий.
- **Национальный режим**: Проверка ПП РФ № 1875 (минимальная доля), ПП № 616 (запрет), ПП № 617 ("третий лишний").
- **Каталог поставщиков**: Поиск по Neon PostgreSQL с интервальным сопоставлением габаритов (ПОКРЫВАЕТ / ПЕРЕСЕКАЕТ / В ДОПУСКЕ / НЕТ ДАННЫХ).
- **Карточки товаров**: Детальная спецификация, параметры, OKПД2/КТРУ, иконки параметров.
- **Шаблоны документов**: Генерация запросов закрывающих документов, протоколов разногласий, ответов на претензии.
- **Чат-консультант**: AI-ассистент с доступом к базе товаров и SQL-запросам.
- **Глубокий аудит**: Анализ спорных пунктов с ссылками на практику ФАС и арбитражей.
- **История анализов**: Firebase Firestore — сохранение, версионирование, сравнение.
- **PDF-отчёт**: Экспорт полного анализа в PDF.
- **Тёмная тема**: Адаптация под системные настройки.
- **Multi-LLM**: Gemini, Mistral, OpenAI, Claude, DeepSeek, DeepInfra, Ollama, кастомные API.

## Архитектура

```
client (React/Vite)            server (Express/Vite SSR)
┌───────────────────┐          ┌───────────────────────┐
│  DocumentUploader  │──POST──▶│  /api/analyze          │──▶ Gemini
│  TenderChatModal   │──POST──▶│  /api/chat             │──▶ Gemini + SQL
│  SupplierSearch    │──POST──▶│  /api/search-suppliers │──▶ Gemini Search
│  AuthAndHistory    │─────────▶│  Firebase Firestore    │
│  SuppliersCatalog  │──GET ──▶│  /api/neon/*           │──▶ Neon PG
└───────────────────┘          └───────────────────────┘
```

### Ключевые компоненты

| Компонент | Роль |
|---|---|
| `App.tsx` | Оркестратор: состояние, модалки, табы |
| `server.ts` | Express-сервер, все API-ручки, LLM-прокси |
| `neonService.ts` | Клиентский класс-обёртка над `/api/neon/*` |
| `firebase.ts` | Firestore: анализ → сохранение → история |

### Хранение данных

- **Neon PostgreSQL**: товары, поставщики, схема `furniture` с EAV-моделью измерений
- **Firebase Firestore**: история анализов, профили заказчиков
- **localStorage**: настройки ИИ, тема, регуляторные гайдлайны

## API Endpoints

### Основные

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/analyze` | Полный анализ закупки |
| POST | `/api/chat` | Чат-консультант с SQL |
| POST | `/api/deep-audit` | Глубокий юр. аудит пункта |
| POST | `/api/search-suppliers` | Поиск поставщиков + аналогов |
| POST | `/api/analyze-image` | OCR скана документа |

### Neon PostgreSQL

| Метод | Путь |
|---|---|
| GET | `/api/neon/status` |
| GET | `/api/neon/schema` |
| GET/POST | `/api/neon/suppliers` |
| GET/POST/PUT/DELETE | `/api/neon/catalog` |
| POST | `/api/furniture/execute-sql` |

### LLM

| Метод | Путь |
|---|---|
| POST | `/api/llm/models` | Список моделей провайдера |
| POST | `/api/llm/test` | Проверка подключения |
| POST | `/api/ocr/mistral` | Mistral OCR |

## LLM-провайдеры

Поддерживаются: `gemini` (по умолчанию), `mistral`, `openai`, `anthropic`, `deepseek`, `deepinfra`/`zipinfra`, `ollama`, `custom`.

Настройка — через UI (AISettingsModal) или `localStorage('llm_user_config_v1')`.

Настройки хранятся локально, ключи API не отправляются на сервер (кроме запросов к выбранному провайдеру).

## Neon DB: схема furniture

```
furniture.product_model       — модели товаров
furniture.supplier            — поставщики
furniture.model_measurement   — EAV: код измерения → value_min/value_max
furniture.dimension_def       — словарь измерений + датум (точка отсчёта)
furniture.match_tender()      — подбор по интервалам (ПОКРЫВАЕТ/ПЕРЕСЕКАЕТ/В ДОПУСКЕ/НЕТ ДАННЫХ)
```

## Разработка

```bash
npm run dev      # разработка
npm run build    # production-сборка
npm run lint     # tsc --noEmit
npm run start    # запуск собранного (node dist/server.cjs)
```

## Команды

| Команда | Результат |
|---|---|
| `/init` | Создать CLAUDE.md для проекта |

## Стек

React 19 · TypeScript · Vite · Tailwind CSS 4 · Express · Gemini AI · Neon PostgreSQL · Firebase · Lucide · Recharts · Mermaid · jsPDF
