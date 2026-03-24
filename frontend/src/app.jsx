import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// ─── Icons (inline SVG helpers) ────────────────────────────────────────────
const Icon = ({ d, size = 18, stroke = 'currentColor', fill = 'none', strokeWidth = 1.75 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const SendIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
)

const BotIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    <line x1="12" y1="3" x2="12" y2="3"/>
    <circle cx="9" cy="16" r="1" fill="currentColor"/>
    <circle cx="15" cy="16" r="1" fill="currentColor"/>
  </svg>
)

const UserIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const PlusIcon = () => <Icon d="M12 5v14M5 12h14" />
const TrashIcon = () => <Icon d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" size={15} />
const ChatIcon = () => <Icon d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" size={15} />

// ─── Typing dots ────────────────────────────────────────────────────────────
const TypingDots = () => (
  <span style={{ display: 'inline-flex', gap: '4px', alignItems: 'center', padding: '2px 0' }}>
    {[0, 1, 2].map(i => (
      <span key={i} style={{
        width: 7, height: 7, borderRadius: '50%', background: 'var(--text-secondary)',
        animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
        display: 'inline-block',
      }} />
    ))}
  </span>
)

// ─── Generate a simple chat ID ───────────────────────────────────────────────
let _id = 0
const uid = () => `chat_${++_id}_${Date.now()}`
const msgId = () => `msg_${++_id}`

// ─── API call ────────────────────────────────────────────────────────────────
async function sendMessage(messages) {
  const res = await fetch('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  const data = await res.json()
  return data.reply
}

// ─── Styles (CSS-in-JS objects) ─────────────────────────────────────────────
const styles = {
  app: {
    display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden',
    background: 'var(--bg-primary)',
  },
  // SIDEBAR
  sidebar: {
    width: 'var(--sidebar-width)', minWidth: 'var(--sidebar-width)',
    background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border-subtle)',
    display: 'flex', flexDirection: 'column',
    padding: '12px 8px',
    gap: '4px',
    overflow: 'hidden',
  },
  newChatBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 12px', borderRadius: 'var(--radius-sm)',
    background: 'none', border: '1px solid var(--border)',
    color: 'var(--text-primary)', cursor: 'pointer',
    fontSize: '0.875rem', fontFamily: 'var(--font-sans)', fontWeight: 500,
    width: '100%', transition: 'all 0.15s',
    marginBottom: 8,
  },
  sidebarSection: {
    fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em',
    color: 'var(--text-muted)', textTransform: 'uppercase',
    padding: '8px 12px 4px',
  },
  chatList: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 },
  chatItem: (active) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '9px 12px', borderRadius: 'var(--radius-sm)',
    background: active ? 'var(--bg-tertiary)' : 'none',
    cursor: 'pointer', transition: 'background 0.12s',
    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
  }),
  chatItemLabel: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: '0.83rem', overflow: 'hidden', flex: 1, minWidth: 0,
  },
  chatItemTitle: {
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  deleteBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', padding: '2px 4px', borderRadius: 4,
    opacity: 0, transition: 'opacity 0.15s, color 0.15s',
    flexShrink: 0,
  },
  // MAIN
  main: {
    flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    background: 'var(--bg-primary)',
  },
  topBar: {
    padding: '14px 24px', borderBottom: '1px solid var(--border-subtle)',
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'var(--bg-secondary)',
  },
  topBarTitle: { fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' },
  statusDot: (ok) => ({
    width: 7, height: 7, borderRadius: '50%',
    background: ok ? '#3fb950' : '#f85149',
    boxShadow: ok ? '0 0 6px #3fb95088' : '0 0 6px #f8514988',
  }),
  // MESSAGES
  messages: {
    flex: 1, overflowY: 'auto', padding: '24px 0',
    display: 'flex', flexDirection: 'column',
  },
  emptyState: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 12,
    color: 'var(--text-muted)', padding: '48px 24px', textAlign: 'center',
  },
  emptyIcon: {
    width: 56, height: 56, borderRadius: '50%',
    background: 'var(--bg-tertiary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid var(--border)',
    color: 'var(--accent)',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)' },
  emptySubtitle: { fontSize: '0.85rem', maxWidth: 320, lineHeight: 1.6 },
  // MESSAGE ROW
  row: {
    padding: '4px 0', animation: 'fadeSlideUp 0.25s ease both',
  },
  rowInner: {
    maxWidth: 740, margin: '0 auto', padding: '0 24px',
    display: 'flex', gap: 12, alignItems: 'flex-start',
  },
  avatar: (role) => ({
    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: role === 'user' ? 'var(--bg-message-user)' : 'var(--accent-dim)',
    border: `1px solid ${role === 'user' ? '#1e4d80' : 'var(--border)'}`,
    color: role === 'user' ? '#7bb3f0' : 'var(--accent)',
    marginTop: 2,
  }),
  bubble: (role) => ({
    flex: 1, fontSize: '0.93rem', color: 'var(--text-primary)',
    background: role === 'user' ? 'var(--bg-message-user)' : 'transparent',
    borderRadius: role === 'user' ? 'var(--radius)' : 0,
    padding: role === 'user' ? '10px 14px' : '4px 0',
    border: role === 'user' ? '1px solid #1e4d80' : 'none',
    lineHeight: 1.65,
  }),
  // INPUT AREA
  inputArea: {
    padding: '16px 24px 20px', background: 'var(--bg-primary)',
    borderTop: '1px solid var(--border-subtle)',
  },
  inputWrap: {
    maxWidth: 740, margin: '0 auto',
    background: 'var(--bg-input)', borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    display: 'flex', alignItems: 'flex-end', gap: 8, padding: '10px 12px',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  textarea: {
    flex: 1, background: 'none', border: 'none', outline: 'none',
    color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
    fontSize: '0.93rem', lineHeight: 1.55, resize: 'none',
    minHeight: 24, maxHeight: 200, overflow: 'auto',
  },
  sendBtn: (disabled) => ({
    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
    background: disabled ? 'var(--bg-tertiary)' : 'var(--accent)',
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: disabled ? 'var(--text-muted)' : '#fff',
    transition: 'all 0.15s', marginBottom: 1,
  }),
  disclaimer: {
    textAlign: 'center', fontSize: '0.73rem', color: 'var(--text-muted)',
    marginTop: 10, maxWidth: 740, margin: '10px auto 0',
  },
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [chats, setChats] = useState([{ id: uid(), title: 'New chat', messages: [] }])
  const [activeChatId, setActiveChatId] = useState(chats[0].id)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiOk, setApiOk] = useState(null)
  const [hoveredChat, setHoveredChat] = useState(null)
  const textareaRef = useRef(null)
  const bottomRef = useRef(null)
  const inputWrapRef = useRef(null)

  const activeChat = chats.find(c => c.id === activeChatId) ?? chats[0]

  // Health check
  useEffect(() => {
    fetch('/health').then(r => r.ok ? r.json() : null).then(d => setApiOk(d?.rag_ready ?? false)).catch(() => setApiOk(false))
  }, [])

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeChat?.messages, loading])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
  }, [input])

  // Input focus ring
  const handleFocus = () => { if (inputWrapRef.current) inputWrapRef.current.style.borderColor = 'var(--accent)'; inputWrapRef.current.style.boxShadow = '0 0 0 2px var(--accent-glow)' }
  const handleBlur  = () => { if (inputWrapRef.current) inputWrapRef.current.style.borderColor = 'var(--border)'; inputWrapRef.current.style.boxShadow = 'none' }

  const updateChat = useCallback((id, updater) => {
    setChats(prev => prev.map(c => c.id === id ? updater(c) : c))
  }, [])

  const newChat = () => {
    const c = { id: uid(), title: 'New chat', messages: [] }
    setChats(prev => [c, ...prev])
    setActiveChatId(c.id)
    setInput('')
  }

  const deleteChat = (e, id) => {
    e.stopPropagation()
    setChats(prev => {
      const next = prev.filter(c => c.id !== id)
      if (next.length === 0) {
        const fresh = { id: uid(), title: 'New chat', messages: [] }
        setActiveChatId(fresh.id)
        return [fresh]
      }
      if (id === activeChatId) setActiveChatId(next[0].id)
      return next
    })
  }

  const submit = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { id: msgId(), role: 'user', content: text }

    // Add user message & update title if first message
    updateChat(activeChatId, c => ({
      ...c,
      title: c.messages.length === 0 ? text.slice(0, 40) + (text.length > 40 ? '…' : '') : c.title,
      messages: [...c.messages, userMsg],
    }))
    setInput('')
    setLoading(true)

    try {
      const history = [...activeChat.messages, userMsg].map(m => ({ role: m.role, content: m.content }))
      const reply = await sendMessage(history)
      const assistantMsg = { id: msgId(), role: 'assistant', content: reply }
      updateChat(activeChatId, c => ({ ...c, messages: [...c.messages, assistantMsg] }))
    } catch (err) {
      const errMsg = { id: msgId(), role: 'assistant', content: `⚠️ Error: ${err.message}` }
      updateChat(activeChatId, c => ({ ...c, messages: [...c.messages, errMsg] }))
    } finally {
      setLoading(false)
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  return (
    <div style={styles.app}>
      {/* ── Sidebar ── */}
      <aside style={styles.sidebar}>
        <button
          style={styles.newChatBtn}
          onClick={newChat}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = '#444' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          <PlusIcon /> New chat
        </button>

        <div style={styles.sidebarSection}>History</div>
        <div style={styles.chatList}>
          {chats.map(c => (
            <div
              key={c.id}
              style={styles.chatItem(c.id === activeChatId)}
              onClick={() => setActiveChatId(c.id)}
              onMouseEnter={e => { if (c.id !== activeChatId) e.currentTarget.style.background = 'var(--bg-hover)'; setHoveredChat(c.id) }}
              onMouseLeave={e => { if (c.id !== activeChatId) e.currentTarget.style.background = 'none'; setHoveredChat(null) }}
            >
              <span style={styles.chatItemLabel}>
                <ChatIcon />
                <span style={styles.chatItemTitle}>{c.title}</span>
              </span>
              <button
                style={{ ...styles.deleteBtn, opacity: hoveredChat === c.id ? 1 : 0 }}
                onClick={e => deleteChat(e, c.id)}
                title="Delete chat"
                onMouseEnter={e => e.currentTarget.style.color = '#f85149'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={styles.main}>
        {/* Top bar */}
        <header style={styles.topBar}>
          <div style={styles.statusDot(apiOk)} title={apiOk ? 'Backend connected' : 'Backend offline'} />
          <span style={styles.topBarTitle}>
            {apiOk === null ? 'Connecting…' : apiOk ? 'RAG Chat' : 'Backend offline — start FastAPI server'}
          </span>
        </header>

        {/* Messages */}
        <div style={styles.messages}>
          {activeChat.messages.length === 0 && !loading ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M12 2a10 10 0 1 0 10 10H12V2z" strokeLinecap="round"/>
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                  <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.4"/>
                </svg>
              </div>
              <div style={styles.emptyTitle}>Ask me anything</div>
              <div style={styles.emptySubtitle}>
                This assistant is powered by your RAG pipeline. Ask questions about your data.
              </div>
            </div>
          ) : (
            <>
              {activeChat.messages.map(msg => (
                <MessageRow key={msg.id} msg={msg} />
              ))}
              {loading && (
                <div style={styles.row}>
                  <div style={styles.rowInner}>
                    <div style={styles.avatar('assistant')}><BotIcon /></div>
                    <div style={{ ...styles.bubble('assistant'), paddingTop: 6 }}>
                      <TypingDots />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div style={styles.inputArea}>
          <div ref={inputWrapRef} style={styles.inputWrap}>
            <textarea
              ref={textareaRef}
              rows={1}
              style={styles.textarea}
              placeholder="Message your RAG assistant…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={loading}
            />
            <button
              style={styles.sendBtn(!input.trim() || loading)}
              onClick={submit}
              disabled={!input.trim() || loading}
              title="Send (Enter)"
            >
              {loading
                ? <div style={{ width: 14, height: 14, border: '2px solid #555', borderTopColor: 'var(--text-secondary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : <SendIcon />
              }
            </button>
          </div>
          <div style={styles.disclaimer}>
            Responses are generated by your local RAG pipeline. Press <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', background: 'var(--bg-tertiary)', padding: '1px 5px', borderRadius: 4, border: '1px solid var(--border)' }}>Enter</kbd> to send · <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', background: 'var(--bg-tertiary)', padding: '1px 5px', borderRadius: 4, border: '1px solid var(--border)' }}>Shift+Enter</kbd> for new line
          </div>
        </div>
      </main>
    </div>
  )
}

// ─── MessageRow ──────────────────────────────────────────────────────────────
function MessageRow({ msg }) {
  return (
    <div style={styles.row}>
      <div style={styles.rowInner}>
        <div style={styles.avatar(msg.role)}>
          {msg.role === 'user' ? <UserIcon /> : <BotIcon />}
        </div>
        <div style={styles.bubble(msg.role)}>
          {msg.role === 'assistant' ? (
            <div className="prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            </div>
          ) : (
            <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
          )}
        </div>
      </div>
    </div>
  )
}