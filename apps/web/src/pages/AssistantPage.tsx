import React, { useState } from 'react';
import { Bot, Check, Mic, MicOff, Send } from 'lucide-react';
import type { AssistantResponse } from '@betul/ai-contracts';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../services/api';

interface ChatTurn {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  response?: AssistantResponse;
}

const STARTER_PROMPTS = [
  'Mujhe ghar wali yojana ka form bharna hai',
  'I am a farmer with 2 acres of land. Which schemes may apply to me?',
  'I have completed graduation and need employment opportunities.',
  'Which villages have incomplete agriculture data?',
  'Compare the school infrastructure of five villages.',
  'Create a Horticulture Department for the Betul district',
];

export function AssistantPage() {
  const { lang } = useAuth();
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text:
        lang === 'hi'
          ? 'नमस्ते! मैं बैतूल जिला AI सहायक हूँ। आप टाइप करके या माइक बटन से हिन्दी/अंग्रेज़ी में पूछ सकते हैं।'
          : 'Hello! I am the Betul District AI & Voice Assistant. Type or use the microphone button to ask in Hindi, English, or mixed Hinglish.',
    },
  ]);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);

  async function sendMessage(text: string, confirmedActionToken?: string) {
    const trimmed = text.trim();
    if (!trimmed && !confirmedActionToken) return;

    if (trimmed) {
      setTurns((prev) => [...prev, { id: `u-${Date.now()}`, sender: 'user', text: trimmed }]);
      setInput('');
    }

    setBusy(true);
    try {
      const res = await apiRequest<AssistantResponse>('/assistant/query', {
        method: 'POST',
        body: JSON.stringify({
          message: trimmed || 'Confirm action',
          language: lang,
          confirmedActionToken,
        }),
      });
      setTurns((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, sender: 'assistant', text: res.reply, response: res },
      ]);
    } catch (err) {
      setTurns((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          sender: 'assistant',
          text: err instanceof Error ? err.message : 'Assistant request failed.',
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function startVoiceInput() {
    const SpeechRec =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    if (!SpeechRec) {
      setTurns((prev) => [
        ...prev,
        {
          id: `v-${Date.now()}`,
          sender: 'assistant',
          text: 'Browser speech recognition is unavailable here. You can type Hindi, Hinglish, or English directly (e.g., "Mujhe ghar wali yojana ka form bharna hai").',
        },
      ]);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = new (SpeechRec as any)();
    rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    rec.interimResults = false;
    setListening(true);
    rec.onresult = (event: { results: Array<Array<{ transcript: string }>> }) => {
      const spoken = event.results?.[0]?.[0]?.transcript ?? '';
      setListening(false);
      if (spoken) setInput(spoken);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">AI &amp; Voice District Assistant</h2>
        <p className="text-sm text-slate-600 mt-1">
          Role-aware assistant with Hindi/Hinglish voice understanding, clarification for unclear speech, and confirmation previews before administrative actions.
        </p>
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        {STARTER_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => sendMessage(p)}
            className="text-xs px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-[#0f2942] text-slate-700 transition"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Window */}
      <div className="bg-white rounded-2xl border border-slate-200 flex flex-col h-[500px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {turns.map((turn) => (
            <div
              key={turn.id}
              className={`flex ${turn.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-line ${
                  turn.sender === 'user'
                    ? 'bg-[#0f2942] text-white'
                    : 'bg-slate-100 text-slate-900'
                }`}
              >
                {turn.sender === 'assistant' && (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0f2942] mb-1">
                    <Bot size={14} /> Betul Assistant
                  </div>
                )}
                <div>{turn.text}</div>

                {/* Clarification Chips */}
                {turn.response?.needsClarification && turn.response.clarificationOptions && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {turn.response.clarificationOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => sendMessage(`Yes, check my eligibility for ${opt}`)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-[#0f2942] text-[#0f2942] text-xs font-semibold hover:bg-[#0f2942] hover:text-white transition"
                      >
                        Yes: {opt}
                      </button>
                    ))}
                  </div>
                )}

                {/* Proposed Admin Action Confirmation Card */}
                {turn.response?.proposedAction && (
                  <div className="mt-3 p-3 rounded-xl bg-white border border-amber-300 space-y-2">
                    <div className="text-xs font-bold text-slate-900">
                      {turn.response.proposedAction.title}
                    </div>
                    <div className="text-xs text-slate-600">
                      {turn.response.proposedAction.summary}
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        sendMessage(
                          `Confirm: ${turn.response!.proposedAction!.title}`,
                          turn.response!.proposedAction!.actionToken,
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                    >
                      <Check size={14} /> Confirm &amp; Execute
                    </button>
                  </div>
                )}

                {/* Citations & Telemetry */}
                {turn.response && (
                  <div className="mt-2 pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 flex flex-wrap gap-3">
                    {turn.response.citations[0] && (
                      <span>Source: {turn.response.citations[0].source}</span>
                    )}
                    <span>
                      {turn.response.telemetry.latencyMs}ms • ~{turn.response.telemetry.estimatedTokens}{' '}
                      tokens
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="p-3 border-t border-slate-200 flex items-center gap-2"
        >
          <button
            type="button"
            onClick={startVoiceInput}
            title="Speak in Hindi or English"
            className={`p-2.5 rounded-xl border transition ${
              listening
                ? 'bg-red-50 border-red-400 text-red-600'
                : 'border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask in English, Hindi, or Hinglish..."
            className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f2942] hover:bg-[#163a5f] text-white text-sm font-medium disabled:opacity-50"
          >
            <Send size={15} /> Send
          </button>
        </form>
      </div>
    </div>
  );
}
