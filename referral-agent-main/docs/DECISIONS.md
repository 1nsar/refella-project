# Решения и открытые вопросы

## 2026-09-12 — перенос в основной репозиторий

- Пользователь указал `yerdaulet-damir/referral-agent` как конфиденциальный основной репозиторий. GitHub visibility проверена: PRIVATE.
- Добавлена документация продукта, ICP, сценариев, интеграций и handoff для агента контента. Код продукта не добавлен.
- Канонический источник теперь `docs/PRODUCT.md`. Ранее созданная отдельная папка research остаётся архивом исследования, не основным источником будущих решений.
- Сохранены исходный one-liner и принцип отсутствия клиентского приложения.
- Partner cross-sell сохранён как отдельная будущая гипотеза. Не считать принятым расширением текущего MVP.
- Барбершоп остаётся предлагаемым сценарием, не выбранным пользователем рынком. Проверенная booking integration пока отсутствует; fallback — честно названная заявка.
- Отдельный public submission repository не создан; копирование private repo не разрешено автоматически.

## До реализации / записи видео

Implementation update 2026-09-12: started private branch codex/referral-mvp with explicit user authorization for parallel engineers. Dispatch ownership in ENGINEERING.md. Selected eve + static owner UI + Supabase and OpenRouter-compatible provider; no Next.js SSR in current workspace. Implemented booking requests, not calendar bookings. Reviewer found native Telegram inline approval auth loss; use authenticated text approval. No external deployment, hosted migration or public export performed. Live credentials/testing remain required.

1. Выбрать один канал и подтвердить доступ; не ждать одновременно все интеграции.
2. Зафиксировать рабочую ветку демо: заявка или подтверждённая запись.
3. Получить безопасные тестовые аккаунты и согласовать synthetic campaign.
4. Подключить test Supabase/OpenRouter через окружение, не git.
5. Получить от коллеги URL лендинга и согласовать ownership кабинета.
6. Зафиксировать официальный период хакатона и созданный в него код.
7. После тестов обновить EVIDENCE и только затем финализировать ролик.
