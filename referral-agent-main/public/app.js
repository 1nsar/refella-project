'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const storageKey = 'referral-owner-session';
  let session = null;
  let dashboard = null;
  let selected = null;
  let loading = false;
  let generation = 0;
  const statusNames = {requested:'Новая заявка',purchased:'Покупка подтверждена',cancelled:'Отменена'};
  const actionable = request => request?.status === 'requested';
  const errors = {
    invalid_login:'Email или пароль не подошли. Проверьте данные и войдите снова.',
    unauthorized:'Сеанс закончился. Войдите снова.',
    forbidden:'Нет доступа к этому бизнесу.',
    try_later:'Слишком много попыток входа. Подождите минуту.',
    invalid_input:'Проверьте введённые данные.',
    invalid_purchase:'Покупку нельзя подтвердить с этими данными.',
    idempotency_conflict:'Это подтверждение уже использовано с другими данными. Обновите список; не создавайте повторную покупку.',
    already_purchased:'Покупка уже подтверждена. Обновите список.',
    request_cancelled:'Заявка отменена. Обновите список.',
    request_not_found:'Заявка не найдена. Обновите список.',
    storage_not_configured:'Подключение к базе не настроено. Обратитесь к администратору.',
    storage_unavailable:'База временно недоступна. Обновите список перед повтором действия.',
    internal_error:'Сервер не выполнил действие. Обновите список перед повтором.',
  };
  function notice(message, error = false) { $('notice').textContent = message; $('notice').hidden = !message; $('notice').classList.toggle('error', error); }
  function el(tag, value, cls) { const node = document.createElement(tag); if (value !== undefined) node.textContent = String(value); if (cls) node.className = cls; return node; }
  function money(minor) { return Number.isSafeInteger(minor) ? new Intl.NumberFormat('ru-KZ',{style:'currency',currency:'KZT'}).format(minor / 100) : 'Сумма не указана'; }
  function date(value) { if (!value) return 'Не указано'; const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString('ru-KZ',{dateStyle:'short',timeStyle:'short'}); }
  function businessId() { return $('business').value; }
  function eventKey(id) { return `referral-confirm:${businessId()}:${id}`; }
  function retryEvent(id) { try { return JSON.parse(sessionStorage.getItem(eventKey(id)) || 'null'); } catch { return null; } }
  function parseAmount(value) {
    const normalized = value.trim().replace(',','.');
    if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) throw new Error('Укажите положительную сумму в тенге, не более двух знаков после запятой.');
    const [whole, fraction = ''] = normalized.split('.');
    const minor = Number(whole) * 100 + Number(fraction.padEnd(2,'0'));
    if (!Number.isSafeInteger(minor) || minor <= 0) throw new Error('Сумма должна быть больше нуля и не превышать допустимый размер.');
    return minor;
  }
  async function api(path, body, authenticated = true) {
    const headers = {'Accept':'application/json'};
    if (authenticated) headers.Authorization = `Bearer ${session.accessToken}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const response = await fetch(path,{method:body === undefined ? 'GET' : 'POST',headers,body:body === undefined ? undefined : JSON.stringify(body),cache:'no-store'});
    let payload; try { payload = await response.json(); } catch { throw new Error('Сервер вернул неожиданный ответ. Обновите данные и повторите попытку.'); }
    if (!response.ok) {
      if (response.status === 401 && authenticated) logout();
      const detail = typeof payload.error === 'string' ? payload.error : payload.error?.message || payload.message;
      throw new Error(errors[detail] || detail || (response.status === 401 ? 'Войдите снова: сеанс закончился.' : `Не удалось выполнить действие (${response.status}).`));
    }
    return payload;
  }
  function setBusy(busy) {
    loading = busy;
    $('workspace').setAttribute('aria-busy',String(busy));
    for (const node of document.querySelectorAll('#workspace button, #workspace input, #workspace select')) node.disabled = busy;
    $('refresh').disabled = busy;
    if (!busy && selected) $('amount').readOnly = Boolean(retryEvent(selected.id));
  }
  function table(containerId, headers, rows, emptyText) {
    const container = $(containerId); container.replaceChildren();
    if (!rows.length) { container.append(el('p',emptyText,'empty')); return; }
    const wrapper = el('div',undefined,'table-scroll');
    const grid = el('table'); const head = el('thead'); const heading = el('tr');
    for (const label of headers) { const cell = el('th',label); cell.scope = 'col'; heading.append(cell); }
    head.append(heading); grid.append(head); const body = el('tbody');
    for (const row of rows) body.append(row); grid.append(body); wrapper.append(grid); container.append(wrapper);
  }
  function render() {
    const campaign = dashboard.campaign;
    $('campaign-heading').textContent = campaign?.name || 'Реферальная программа не настроена';
    $('offer').textContent = campaign ? (typeof campaign.terms === 'string' ? campaign.terms : '') : 'Проверяйте заявки ниже. Условия и начисления определяет настройка программы на сервере.';
    $('terms').textContent = campaign ? `Бонус: ${Number.isSafeInteger(campaign.reward_units) ? campaign.reward_units : 'не указан'} ед. Минимальная покупка: ${money(campaign.min_purchase_minor)}.` : '';
    $('test-mode').hidden = dashboard.testMode !== true;
    const requests = Array.isArray(dashboard.requests) ? dashboard.requests : [];
    $('request-count').textContent = `${requests.length} в списке${dashboard.limit ? ` · лимит ${dashboard.limit}` : ''}`;
    table('request-list',['Клиент / услуга','Желаемое время','Статус',''],requests.map(request => {
      const row = el('tr'); if (request.id === selected?.id) row.className = 'selected';
      const who = el('td'); who.append(el('span',request.customer_name || 'Клиент'),el('small',request.service || 'Услуга не указана'),el('small',`Заявка ${String(request.id).slice(0,8)}`));
      row.append(who,el('td',request.preferred_time || 'Не указано'),el('td',statusNames[request.status] || request.status || 'Статус не указан','status'));
      const action = el('td'); if (actionable(request)) { const button = el('button','Выбрать','quiet'); button.type = 'button'; button.setAttribute('aria-label',`Выбрать заявку: ${request.service || request.id}`); button.addEventListener('click',() => choose(request)); action.append(button); } row.append(action); return row;
    }),'Заявок пока нет. Здесь появятся запросы клиентов из подключённого мессенджера.');
    table('purchase-list',['Дата','Заявка','Сумма'],(dashboard.conversions || []).map(item => { const row = el('tr'); row.append(el('td',date(item.created_at)),el('td',item.request_id ? String(item.request_id).slice(0,8) : 'Не указана'),el('td',money(item.amount_minor))); return row; }),Array.isArray(dashboard.conversions) ? 'Подтверждённых покупок пока нет.' : 'Сведения о покупках не предоставлены сервером.');
    table('reward-list',['Дата','Бонус'],(dashboard.rewards || []).map(item => { const row = el('tr'); const units = item.reward_units; row.append(el('td',date(item.created_at)),el('td',Number.isSafeInteger(units) ? `${units} ед.` : 'Не указан')); return row; }),'Начисленных бонусов пока нет.');
  }
  function choose(request) {
    if (loading) return;
    selected = request; $('selection-empty').hidden = true; $('confirm-form').hidden = false;
    $('selected-name').textContent = request.customer_name || `Заявка ${String(request.id).slice(0,8)}`;
    $('selected-service').textContent = request.service || 'Услуга не указана';
    const retry = retryEvent(request.id); $('amount').value = retry ? String(retry.amountMinor / 100) : ''; $('amount').readOnly = Boolean(retry); $('payment-check').checked = false;
    $('amount-help').textContent = retry ? 'Сумма сохранена для безопасного повтора. Если результат прошлой попытки неизвестен, повтор не должен создавать второе начисление.' : 'До двух знаков после запятой. Бонус рассчитает сервер по правилам программы.';
    render(); $('action-heading').scrollIntoView({block:'nearest',behavior:'auto'}); $('amount').focus();
  }
  function clearSelection() { selected = null; $('confirm-form').hidden = true; $('selection-empty').hidden = false; }
  async function refresh() {
    const current = ++generation; const id = businessId(); if (!id || !session) return;
    setBusy(true);
    try { const data = await api(`/api/dashboard?businessId=${encodeURIComponent(id)}`); if (current !== generation) return; dashboard = data; clearSelection(); render(); }
    catch (error) { if (current === generation) notice(error.message,true); }
    finally { if (current === generation) setBusy(false); }
  }
  function showWorkspace() {
    $('business').replaceChildren(); for (const business of session.businesses) { const option = el('option',business.name || business.id); option.value = business.id; $('business').append(option); }
    $('login-view').hidden = true; $('workspace').hidden = false; $('account').hidden = false;
    if (!session.businesses.length) { notice('Для этого аккаунта нет доступных бизнесов. Попросите администратора предоставить доступ.',true); $('workspace').hidden = true; return; }
    refresh();
  }
  function logout() { generation++; session = null; dashboard = null; clearSelection(); sessionStorage.removeItem(storageKey); $('workspace').hidden = true; $('account').hidden = true; $('login-view').hidden = false; $('password').value = ''; notice(''); }
  $('login-form').addEventListener('submit',async event => {
    event.preventDefault(); const button = event.submitter; button.disabled = true; notice('');
    try { const data = await api('/api/login',{email:$('email').value.trim(),password:$('password').value},false); if (!data.accessToken || !Array.isArray(data.businesses)) throw new Error('Сервер не вернул доступ к кабинету.'); session = {accessToken:data.accessToken,businesses:data.businesses}; sessionStorage.setItem(storageKey,JSON.stringify(session)); $('password').value = ''; showWorkspace(); }
    catch (error) { notice(error.message,true); } finally { button.disabled = false; }
  });
  $('confirm-form').addEventListener('submit',async event => {
    event.preventDefault(); if (!selected || loading) return;
    const request = selected; let operation;
    try { const amountMinor = parseAmount($('amount').value); operation = retryEvent(request.id); if (operation && operation.amountMinor !== amountMinor) throw new Error('Повтор подтверждения должен использовать исходную сумму.'); if (!operation) { operation = {eventId:crypto.randomUUID(),amountMinor}; sessionStorage.setItem(eventKey(request.id),JSON.stringify(operation)); } }
    catch (error) { notice(error.message,true); return; }
    setBusy(true); notice('');
    try { await api('/api/confirm',{businessId:businessId(),requestId:request.id,...operation}); notice('Подтверждение принято сервером. Обновляем список.'); await refresh(); }
    catch (error) { notice(`Подтверждение не получено: ${error.message} Обновите список перед повтором.`,true); }
    finally { setBusy(false); }
  });
  $('cancel-request').addEventListener('click',async () => {
    if (!selected || loading || !window.confirm('Отменить эту заявку? Подтверждённые покупки этой кнопкой не отменяются.')) return;
    const request = selected; setBusy(true); notice('');
    try { await api('/api/cancel',{businessId:businessId(),requestId:request.id}); notice('Отмена принята сервером.'); await refresh(); }
    catch (error) { notice(error.message,true); } finally { setBusy(false); }
  });
  $('business').addEventListener('change',() => { notice(''); clearSelection(); dashboard = null; $('request-list').replaceChildren(); $('purchase-list').replaceChildren(); $('reward-list').replaceChildren(); refresh(); });
  $('refresh').addEventListener('click',() => { notice(''); refresh(); }); $('logout').addEventListener('click',logout);
  try { const stored = JSON.parse(sessionStorage.getItem(storageKey) || 'null'); if (stored?.accessToken && Array.isArray(stored.businesses)) { session = stored; showWorkspace(); } } catch { sessionStorage.removeItem(storageKey); }
})();
