'use strict';
(() => {
  const $ = id => document.getElementById(id);
  let envelope = null;
  let busy = false;
  const errorText = {
    demo_disabled:'This demo is currently disabled. Ask the team to enable it.',
    model_not_configured:'The AI connection is not configured. Ask the team to check the demo setup.',
    demo_expired:'Your demo session has expired. Enter the judge access code again.',
    demo_capacity:'The demo has reached its session capacity. Please ask the team for access.',
    demo_limit:'This session has reached its AI message limit. You can still review the journey.',
    origin_rejected:'This request did not come from the demo page. Open the demo directly and try again.',
    turn_in_progress:'A reply is already being prepared. Wait a moment, then refresh before retrying.',
    proposal_required:'Ask the assistant about a service and preferred time before sending a request.',
    request_required:'Send a demo request before simulating a paid visit.',
    future_time_required:'Choose a preferred time in the future and ask the assistant to update the request.',
    invalid_code:'That access code did not work. Check the code provided by the team.',
    unauthorized:'Your demo session has expired. Enter the judge access code again.',
    session_expired:'Your demo session has expired. Enter the judge access code again.',
    rate_limited:'The demo is receiving too many requests. Wait a moment, then try again.',
    try_later:'Please wait a moment before trying again.',
    limit_reached:'This demo session has reached its message limit. You can still review the journey.',
    invalid_input:'Check your message and try again.',
    no_proposal:'There is no request to send yet. Ask the assistant about a service and preferred time.',
    no_request:'Send a demo request before simulating a paid visit.',
    model_unavailable:'The AI service is unavailable. Your text is preserved; try again shortly.',
    demo_not_configured:'The demo is not configured yet. Ask the team to check its setup.',
  };
  function notice(text = '', error = false) { $('notice').textContent = text; $('notice').hidden = !text; $('notice').classList.toggle('error',error); }
  function element(tag, text, className) { const node = document.createElement(tag); if (text !== undefined) node.textContent = String(text); if (className) node.className = className; return node; }
  function controls() {
    for (const node of document.querySelectorAll('button,#code')) node.disabled = busy;
    const state = envelope?.state;
    $('confirm').disabled = busy || !state?.proposal || Boolean(state?.request);
    $('purchase').disabled = busy || state?.request?.status !== 'requested';
    const exhausted = envelope && envelope.remaining <= 0;
    $('send').disabled = busy || exhausted;
    for (const node of document.querySelectorAll('[data-question]')) node.disabled = busy || exhausted;
    $('message-form').setAttribute('aria-busy',String(busy));
    $('activity').textContent = busy ? 'Working…' : '';
  }
  async function call(path, body) {
    let response;
    try { response = await fetch(path,{method:body === undefined ? 'GET':'POST',credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json',...(body === undefined ? {} : {'Content-Type':'application/json'})},body:body === undefined ? undefined : JSON.stringify(body)}); }
    catch { throw new Error('Cannot reach the demo server. Your message is preserved. Check your connection and try again.'); }
    let data; try { data = await response.json(); } catch { throw new Error('The server returned an unexpected response. Refresh the demo before trying again.'); }
    if (!response.ok) {
      if (response.status === 401) { $('gate').hidden = false; $('experience').hidden = true; }
      throw new Error(errorText[data.error] || `The demo could not complete this action (${data.error || response.status}). Try refreshing; contact the team if it continues.`);
    }
    if (!Array.isArray(data.messages) || !data.state || typeof data.remaining !== 'number') throw new Error('The demo returned incomplete state. Refresh before trying again.');
    return data;
  }
  function render(data) {
    envelope = data; $('gate').hidden = true; $('experience').hidden = false; $('code').value = '';
    const transcript = $('transcript'); transcript.replaceChildren();
    if (!data.messages.length) { const guide = element('p',undefined,'demo-guide'); guide.append(element('strong','Demo guide'),document.createTextNode('Start with a question about Studio Demo. Replies will appear here when the server responds.')); transcript.append(guide); }
    for (const item of data.messages) {
      if (!['assistant','user'].includes(item.role) || typeof item.content !== 'string') continue;
      const message = element('div',undefined,`message ${item.role}`);
      const sourceLabels = {guide:'Demo guide',event:'Demo system',model:'Studio Demo · AI assistant'};
      message.append(element('span',item.role === 'assistant' ? sourceLabels[item.source] || 'Studio Demo' : 'You','message-label'),element('p',item.content,'bubble')); transcript.append(message);
    }
    const state = data.state;
    $('proposal').hidden = !state.proposal || Boolean(state.request);
    $('proposal-service').textContent = state.proposal?.service || 'Not specified';
    $('proposal-time').textContent = state.proposal?.preferredTime || 'Not specified';
    $('request-step').classList.toggle('complete',Boolean(state.request));
    $('request-status').textContent = state.request ? 'Demo request sent' : state.proposal ? 'Waiting for your confirmation' : 'Not sent';
    $('request-detail').textContent = state.request ? `${state.request.service} · ${state.request.preferredTime}. Not a confirmed appointment.` : '';
    const purchased = state.request?.status === 'purchased';
    $('purchase-step').classList.toggle('complete',purchased); $('purchase-status').textContent = purchased ? 'Synthetic purchase recorded' : 'Not simulated';
    const units = state.rewardUnits; const hasReward = Number.isSafeInteger(units) && units > 0;
    $('reward-step').classList.toggle('complete',hasReward); $('reward-status').textContent = hasReward ? `${units} demo bonus units` : 'No reward issued';
    $('remaining').textContent = `${data.remaining} messages remaining`;
    controls(); transcript.scrollTop = transcript.scrollHeight;
  }
  async function perform(path, body, onSuccess) {
    if (busy) return; busy = true; controls(); notice();
    try { const result = await call(path,body); render(result); onSuccess?.(); }
    catch (error) { notice(error.message,true); }
    finally { busy = false; controls(); }
  }
  $('access-form').addEventListener('submit',event => { event.preventDefault(); const code = $('code').value.trim(); if (code) perform('/api/demo/start',{code}); });
  $('message-form').addEventListener('submit',event => {
    event.preventDefault(); const original = $('message').value; const message = original.trim(); if (!message || busy) return;
    perform('/api/demo/message',{message},() => { if ($('message').value === original) $('message').value = ''; $('message').focus(); });
  });
  $('message').addEventListener('keydown',event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); if (!busy && !($('send').disabled)) $('message-form').requestSubmit(); } });
  for (const button of document.querySelectorAll('[data-question]')) button.addEventListener('click',() => { if (busy) return; if ($('message').value.trim()) { $('message').focus(); return; } $('message').value = button.dataset.question; $('message').focus(); });
  $('confirm').addEventListener('click',() => perform('/api/demo/confirm',{}));
  $('purchase').addEventListener('click',() => perform('/api/demo/purchase',{}));
  $('refresh').addEventListener('click',() => perform('/api/demo/state'));
  async function restore() {
    busy = true; controls();
    try { const data = await call('/api/demo/state'); render(data); }
    catch (error) { if (!error.message.includes('session has expired')) notice(error.message,true); }
    finally { busy = false; controls(); }
  }
  restore();
})();
