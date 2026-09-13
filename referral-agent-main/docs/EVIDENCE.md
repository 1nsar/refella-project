# Evidence register

2026-09-12. Ниже исходный реестр; обновление реализации приведено отдельной секцией. Статус исходного плана не заменяет результаты конкретных проверок.

## Обновление: локальный MVP

- Browser demo update: 82 tests pass, including 12 sandbox test groups. Demo isolation, quotas, explicit confirmation and idempotent synthetic reward tested with an injected model stub; no live model call. Browser `/demo` gate and disabled-state message observed on localhost. English Telegram messages authored; remote bot profile unchanged. See JUDGE-DEMO.md.

- SQL миграция реализована и проверена на настоящем изолированном PostgreSQL 15 с минимальной тестовой имитацией Supabase auth. Это не hosted Supabase Auth/RLS smoke.
- Server services, HTTP handlers и Telegram handlers реализованы; 70 тестов прошли (Supabase client и части runtime замоканы). Это не live end-to-end проверка.
- Runtime typecheck и build прошли. GET /app и assets — HTTP 200; anonymous dashboard, generic session и Telegram webhook — HTTP 401 на локальном сервере.
- Реальный browser QA: login desktop/mobile, отсутствие горизонтального переполнения, понятная missing-config ошибка. Авторизованный кабинет не проверен без тестового владельца.
- Переданные URL/publishable key проверены read-only Auth settings: HTTP 200. Секреты не коммитятся; remote migration не выполнялась.
- Telegram tool/auth wiring и OpenRouter adapter реализованы, но реального вызова модели/бота не было. Не называть это end-to-end verified.
- Правило demo seed отличается от старого рекламного примера: внутренние единицы после пороговой покупки, без автоматической скидки другу. См. RUNBOOK.

| Утверждение / функция | Статус | Что нужно для подтверждения |
|---|---|---|
| Private production repository | Проверено через GitHub metadata: PRIVATE | Повторить проверку перед первым push и любым public export |
| Клиент не ставит наше приложение | Требование продукта | Реальный путь двух клиентов только через выбранный мессенджер |
| Персональное приглашение | План | Код в БД, второй аккаунт, корректная атрибуция |
| AI отвечает по условиям | План | Реальный вызов модели и проверка фактов по кампании |
| Заявка | План | Сохранённый запрос и наблюдение владельцем |
| Подтверждённая запись | Не подключена | Успех системы записи, защита от двойного слота |
| Покупка | Для демо предложено ручное тестовое подтверждение | Авторизованный сотрудник и audit event; не утверждать POS-интеграцию |
| Начисление и баланс | План | Транзакция, журнал, чтение баланса правильным клиентом |
| Защита от дублей | Требование | Повтор события не создаёт награду |
| Tenant isolation | Требование | Отрицательные тесты доступа и интеграционного контекста |
| WhatsApp / WABA | Доступ не проверен | Входящее и исходящее сообщение через собственный backend; статус sandbox/production |
| Existing-agent API | Предлагаемая архитектура | Реальный вызов интеграции с проверкой ключа/прав |
| Partner cross-sell | Гипотеза | Два согласившихся бизнеса, каталоги, разрешённая передача и подтверждённый результат |
| Рост выручки / экономия времени / MRR | Не измерены | Пилот, метод сравнения и данные |

Для новых проверок записывать дату, commit, среду, шаги, результат и путь к безопасному артефакту. Synthetic purchase обозначать synthetic. Наличие unit-тестов не равно проверенному live-каналу. Не хранить секреты или реальные customer data в артефактах.
