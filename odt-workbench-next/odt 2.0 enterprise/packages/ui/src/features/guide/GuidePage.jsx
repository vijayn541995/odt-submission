import React, { useState } from 'react';
import {
  InfoList,
  PageHeader,
  Panel,
  StatusBadge
} from '../../primitives/index.js';

function requireDependency(value, name) {
  if (!value) {
    throw new Error(`GuidePage requires ${name}`);
  }
  return value;
}

export function GuidePage({
  data,
  setActivePage,
  actions = {},
  helpers = {}
}) {
  const postJson = requireDependency(actions.postJson, 'actions.postJson');
  const activeAssignmentId = requireDependency(helpers.activeAssignmentId, 'helpers.activeAssignmentId');
  const currentWorkBrief = requireDependency(helpers.currentWorkBrief, 'helpers.currentWorkBrief');
  const contextualGuidePrompts = requireDependency(helpers.contextualGuidePrompts, 'helpers.contextualGuidePrompts');
  const navigate = requireDependency(setActivePage, 'setActivePage');

  const assignmentId = activeAssignmentId(data);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi, I am your ODT platform coach. I can answer quick everyday questions, explain how to use ODT, and use workbench evidence when you ask about the active SDLC task.' }
  ]);
  const [busy, setBusy] = useState(false);
  const latestUsage = data.usage.events?.[0];
  const workBrief = currentWorkBrief(data);
  const guidePrompts = contextualGuidePrompts(workBrief);

  async function send(message = input) {
    const text = message.trim();
    if (!text) return;
    setMessages((current) => [...current, { role: 'user', content: text }]);
    setInput('');
    setBusy(true);
    try {
      const response = await postJson('/api/ai/chat', {
        input: text,
        sessionId: 'odt-guide-ui',
        assignmentId
      });
      setMessages((current) => [...current, {
        role: 'assistant',
        content: String(response.content || ''),
        meta: {
          provider: response.provider || 'local',
          model: response.model || 'local-guide-model',
          fallbackUsed: Boolean(response.fallbackUsed),
          sources: Array.isArray(response.sources) ? response.sources : [],
          error: response.error || null
        }
      }]);
      await data.refresh();
    } catch (err) {
      setMessages((current) => [...current, { role: 'assistant', content: `I could not reach the guide backend: ${err.message}` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="ODT Guide"
        title="Platform coach and evidence guide"
        copy="Ask how to use ODT, what a button does, why a workflow is gated, or what the active assignment needs next."
      />
      <div className="guide-layout">
        <section className="chat-panel">
          <div className="prompt-row">
            {guidePrompts.map((prompt) => (
              <button key={prompt} type="button" className="prompt-chip" onClick={() => send(prompt)} disabled={busy}>{prompt}</button>
            ))}
          </div>
          <div className="message-list">
            {messages.map((message, index) => (
              <div className={`message ${message.role}`} key={`${message.role}-${index}`}>
                <span>{message.role === 'user' ? 'You' : 'ODT Guide'}</span>
                <p>{message.content}</p>
                {message.meta ? (
                  <div className="message-meta">
                    <small>{message.meta.provider} / {message.meta.model}</small>
                    {message.meta.fallbackUsed ? <StatusBadge label="Fallback" tone="warning" /> : <StatusBadge label="Provider" tone="success" />}
                    {message.meta.sources?.length ? (
                      <div className="message-sources" aria-label="Sources used by ODT Guide">
                        <strong>Grounded by</strong>
                        {message.meta.sources.slice(0, 4).map((source) => (
                          <span key={`${source.id}-${source.chunk || ''}`}>{source.title}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <form className="chat-input" onSubmit={(event) => { event.preventDefault(); send(); }}>
            <input aria-label="Ask ODT Guide" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask how to use ODT, what a button does, or what is blocking this task..." />
            <button className="primary-button" type="submit" disabled={busy || !input.trim()}>{busy ? 'Thinking' : 'Send'}</button>
          </form>
        </section>
        <aside className="context-panel">
          <Panel title="Current Context" eyebrow="Guide Context">
            <InfoList
              items={[
                ['Configured provider', data.snapshot?.ai?.provider || 'local'],
                ['Provider ready', data.snapshot?.ai?.providerReady ? 'Ready' : 'Local fallback'],
                ['Active model', data.snapshot?.ai?.model || 'local-guide-model'],
                ['Guide mode', 'Handbook + evidence-aware'],
                ['Prompt template', 'guide-chat-v1'],
                ['Requests today', data.usage.summary?.requestsToday || 0],
                ['Latest tokens', latestUsage?.totalTokens || 0],
                ['Latest latency', latestUsage ? `${latestUsage.latencyMs} ms` : 'No requests yet'],
                ['Latest fallback', latestUsage?.fallbackUsed ? 'Yes' : 'No']
              ]}
            />
            <div className="button-row vertical">
              <button type="button" className="secondary-button" onClick={() => navigate('planner')}>Open Planner</button>
              <button type="button" className="secondary-button" onClick={() => navigate('artifacts')}>Open Artifacts</button>
              <button type="button" className="secondary-button" onClick={() => navigate('review')}>Open Review Queue</button>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
