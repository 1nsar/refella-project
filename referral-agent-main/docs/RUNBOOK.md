# Runbook: первый MVP

Для входа судей без Telegram: [browser demo setup](JUDGE-DEMO.md). Этот отдельный sandbox не требует Supabase и не выдаёт реальные бонусы.

## Реализованная граница

Один процесс eve: агент, native Telegram channel, HTTP API и статический кабинет. Supabase хранит бизнесы, кампании, клиентов, рефералы, заявки, покупки и бонусные записи. Пользователь запрашивает услугу, а не получает подтверждённый слот. Владелец подтверждает покупку вручную. Бонус — внутренние единицы, не денежная выплата и не автоматическая скидка кассы.

Для сборки использован eve 0.54.3 по build-agents guidance, native Telegram вместо собственного адаптера, OpenRouter через OpenAI-compatible provider. Кабинету не требуется Next.js/SSR: выбран обычный HTML/JS, чтобы оставить один процесс. Если коллега подключает Next.js-лендинг, он может ссылаться на `/app`; его код не менялся.

## Окружение

1. Node 24, `npm ci` в корне репозитория.
2. Создать `runtime/.env.local` по `.env.example` (не коммитить).
3. `SUPABASE_URL` и `SUPABASE_PUBLISHABLE_KEY`, либо переданные пользователем имена `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. `SUPABASE_SECRET_KEY`: серверный secret/service-role key этого же TEST проекта. Нужен API для операций. Publishable key достаточен для Auth, но не заменяет серверные права.
5. `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` (default `openai/gpt-4.1-mini`). Ключ должен иметь ограниченный бюджет в OpenRouter. Session token limits не являются жёстким долларовым cap и могут быть продлены пользователем; до внешнего запуска настроить общий лимит/квоту.
6. Telegram: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, случайный `TELEGRAM_WEBHOOK_SECRET_TOKEN`, `TELEGRAM_BUSINESS_ID`.
7. Existing-agent API: случайный длинный `REFERRAL_API_KEY` и соответствующий `REFERRAL_BUSINESS_ID`. Этот credential только server-to-server, никогда в браузере или клиентском боте. В MVP один ключ привязан к одному бизнесу; база поддерживает несколько бизнесов, автоматическая регистрация множества ключей/номеров ещё не реализована.

Не добавлять @supabase/ssr или next/headers в текущий статический кабинет. Владелец входит через Supabase Auth email/password, access token хранится в sessionStorage. По истечении токена нужен повторный вход; refresh sessions и self-service signup пока не реализованы.

## База

Использовать отдельный test Supabase project. Перед применением проверить, что таблицы с такими именами не существуют. Применить `supabase/migrations/202609120001_referral_core.sql` через согласованный migration workflow или SQL Editor. Не запускать tests/database/bootstrap.sql в Supabase: это facsimile auth только для локального PostgreSQL.

Создать тестового владельца в Supabase Auth. Его UUID использовать в `supabase/demo-seed.sql` через psql с `-v demo_owner_id=...`. Файл содержит psql meta-команды, целиком в SQL Editor не вставлять. Для ручного редактора выполнить только INSERT-транзакцию, заменив owner placeholder фактическим UUID тестового владельца. Seed не идемпотентный; повторно не запускать.

Demo business ID: `de000000-0000-4000-8000-000000000001`. Условия seed намеренно synthetic: 100 бонусных единиц рекомендателю после первой подходящей покупки минимум 1000 minor units (10 ₸ при принятой KZT шкале 100). Это не реальные маркетинговые условия и не прежний сценарий со скидкой в 1000 ₸. Текущий engine не проверяет категорию услуги и не применяет friend discount к кассе: не обещать их в демо.

## Локальный запуск

`npm run dev` запускает eve без TUI. Адрес печатается в терминале; кабинет `/app`. При старте не из runtime установить `REFERRAL_PUBLIC_DIR` абсолютным путём к `public/`. При переносе build артефактов public/ нужно доставить рядом отдельно — он не встраивается автоматически.

Без secret key кабинет открывается, но серверные операции возвращают понятную ошибку; fake-success режима нет. Без тестового владельца авторизованный кабинет не проверить.

## Подключение Telegram

Бот принимает только текст приватного чата. Framework проверяет secret header до обработки. Публичный HTTPS webhook должен указывать на `/eve/v1/telegram`; зарегистрировать его Bot API `setWebhook` с тем же secret_token. Настройка webhook меняет маршрутизацию бота: выполняется отдельно после согласования URL, не автоматически при запуске.

Пригласивший просит ссылку. Друг открывает `t.me/<bot>?start=<token>`, нажимает Start; backend применяет код перед разговором. Дальше можно спрашивать условия и отправлять заявку. `submit_request` требует подтверждения текстом `approve`/`cancel`. Native inline callback eve 0.54.3 теряет auth: renderer заменён на текстовый, поэтому ответ проходит проверенный onMessage. Не подменять этот обход немым снятием approval.

Generic `/eve/v1/session` и streams закрыты для всех внешних клиентов. Нельзя обходить sender identity через произвольный session ID. Группы, attachments, массовые сообщения и proactive marketing выключены/не реализованы.

## HTTP contract

| Route | Доступ | Вход |
|---|---|---|
| POST /api/login | Email/password | `{email,password}` |
| GET /api/dashboard?businessId=UUID | Bearer owner access token | Бизнес должен принадлежать владельцу |
| POST /api/confirm | Bearer owner | `{businessId,requestId,eventId,amountMinor}` |
| POST /api/cancel | Bearer owner | `{businessId,requestId}` |
| POST /api/referrals/invite | Bearer integration key | `{externalId,displayName?}` |
| POST /api/referrals/claim | Bearer integration key | `{externalId,displayName?,token}` |
| POST /api/referrals/request | Bearer integration key | `{externalId,displayName?,service,preferredTime,requestKey}` |
| POST /api/referrals/rewards | Bearer integration key | `{externalId,displayName?}` |

Integration key владеет идентификацией своих клиентов: выдавать только доверенному backend. Tenant в body запрещён. `preferredTime` — ISO timestamp с offset, `amountMinor` — положительное безопасное целое. Один eventId и неизменная сумма для всех повторов покупки. API customer identities и Telegram identities намеренно разные; автоматически связывать их по имени нельзя.

Все ошибки JSON `{error:code}`. 401 вход, 403 права, 400 данные, 409 конфликт правил, 413 тело слишком велико, 503 нет сервиса/конфигурации. SQL подробности и ключи не возвращаются.

## До production

Live model/tool/approval test, Telegram two-account flow, hosted Supabase RLS test, owner authentication flow, request recovery, обработка возвратов и погашения бонусов, запись автора подтверждения в audit, удаление/retention данных, TTL/expiration приглашений, shared rate limits и полный rollout credentials. Нынешний login rate limit только per-process, consumer traffic quota ещё не полноценная. Версии правил фиксируются; существующее приглашение не теряет свою принятую версию. Согласовать поведение после паузы кампании и ниже минимальной суммы.

Для двух репозиториев public submission экспортировать только явно выбранные файлы. Не копировать git history, .env, сессии, приватную документацию и реальные данные. Сегодня второй репозиторий не создавался.
