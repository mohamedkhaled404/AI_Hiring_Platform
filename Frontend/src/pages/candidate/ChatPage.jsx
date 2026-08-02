import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as chatService from "../../services/chatService";
import * as applicationService from "../../services/applicationService";
import LoadingState from "../../components/common/LoadingState";
import styles from "./ChatPage.module.css";

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return formatTime(dateStr);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function ChatPage() {
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [newChatType, setNewChatType] = useState("general");
  const [newChatJobId, setNewChatJobId] = useState("");
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [creating, setCreating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const activeConversation = conversations.find((c) => c._id === activeId);
  const isMockInterview = activeConversation?.type === "mock_interview";
  const isCompleted = activeConversation?.status === "completed";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    setLoadingConversations(true);
    try {
      const { data } = await chatService.getConversations();
      setConversations(data || []);
    } catch {
      // ignore
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async (id) => {
    if (!id) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    try {
      const { data } = await chatService.getConversation(id);
      setMessages(data.messages || []);
    } catch {
      // ignore
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConversations();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMessages(activeId);
  }, [activeId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || !activeId) return;
    setInput("");
    setSending(true);

    const tempUser = { role: "user", content: text, _id: `temp-${Date.now()}` };
    setMessages((prev) => [...prev, tempUser]);

    try {
      const { data } = await chatService.sendMessage(activeId, text);
      setMessages((prev) => [
        ...prev.filter((m) => m._id !== tempUser._id),
        data.userMessage,
        data.assistantMessage,
      ]);
      loadConversations();
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === tempUser._id ? { ...m, failed: true } : m
        )
      );
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = async () => {
    if (newChatType === "mock_interview" && !newChatJobId) return;
    setCreating(true);
    try {
      const payload = { type: newChatType };
      if (newChatType === "mock_interview") payload.jobId = newChatJobId;
      const { data } = await chatService.createConversation(payload);
      setShowNewChat(false);
      setNewChatType("general");
      setNewChatJobId("");
      await loadConversations();
      setActiveId(data.conversation._id);
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  const handleEndInterview = async () => {
    if (!activeId) return;
    setSending(true);
    try {
      const { data } = await chatService.endInterview(activeId);
      setMessages((prev) => [...prev, data.summary]);
      loadConversations();
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  const handleDelete = (id, title) => {
    setDeleteTarget({ id, title });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeleting(id);
    try {
      await chatService.deleteConversation(id);
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
      setConversations((prev) => prev.filter((c) => c._id !== id));
      setDeleteTarget(null);
    } catch {
      // ignore
    } finally {
      setDeleting(null);
    }
  };

  const openNewChat = async () => {
    setShowNewChat(true);
    setNewChatType("general");
    setNewChatJobId("");
    try {
      const apps = await applicationService.getMyApplications();
      setAppliedJobs(apps || []);
    } catch {
      setAppliedJobs([]);
    }
  };

  const selectConversation = (id) => {
    setActiveId(id);
    setSidebarOpen(false);
  };

  const typeIcon = (type) =>
    type === "mock_interview" ? "bi-person-workspace" : "bi-chat-dots";

  return (
    <div className={styles.wrapper}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className={styles.overlay} />
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "d-flex" : "d-none d-md-flex"} ${styles.aside}`}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.pageTitle}>
            <i className="bi bi-chat-dots me-2" style={{ color: "var(--primary)" }} />
            AI Chat
          </h2>
          <button className={`btn btn-sm ${styles.newChatBtn}`} onClick={openNewChat}>
            <i className="bi bi-plus-lg me-1" /> New
          </button>
        </div>

        <div className={styles.chatListContainer}>
          {loadingConversations ? (
            <LoadingState message="Loading conversations..." />
          ) : conversations.length === 0 ? (
            <div className={styles.emptyState}>No conversations yet.</div>
          ) : (
            conversations.map((c) => (
              <div
                key={c._id}
                onClick={() => selectConversation(c._id)}
                className={styles.conversationItem}
                style={{
                  background: activeId === c._id ? "var(--primary-bg)" : "#fff",
                }}
                onMouseEnter={(e) => { e.currentTarget.querySelector(`.${styles.deleteBtn}`).style.opacity = 1; }}
                onMouseLeave={(e) => { e.currentTarget.querySelector(`.${styles.deleteBtn}`).style.opacity = 0; }}
              >
                <div className={styles.conversationDetails}>
                  <i className={`bi ${typeIcon(c.type)}`} style={{ color: "var(--primary)", fontSize: 14 }} />
                  <span className={styles.conversationTitle}>{c.title}</span>
                  <span className={styles.conversationTimestamp}>{formatDate(c.updatedAt)}</span>
                </div>
                {c.status === "completed" && (
                  <span className={`badge rounded-pill ${styles.statusBadge}`}>Completed</span>
                )}
                <button
                  className={styles.deleteBtn}
                  onClick={(e) => { e.stopPropagation(); handleDelete(c._id, c.title); }}
                  disabled={deleting === c._id}
                  title="Delete conversation"
                >
                  <i className="bi bi-trash" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main chat area */}
      <div className={styles.chatAreaWrapper}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <button
            className={`btn d-md-none ${styles.sidebarToggleBtn}`}
            onClick={() => setSidebarOpen(true)}
          >
            <i className="bi bi-list" />
          </button>
          {activeConversation ? (
            <>
              <i className={`bi ${typeIcon(activeConversation.type)}`} style={{ color: "var(--primary)", fontSize: 18 }} />
              <div>
                <div className={styles.chatHeader}>{activeConversation.title}</div>
                <div className={styles.chatSubHeader}>
                  {activeConversation.type === "mock_interview" ? "Mock Interview" : "General Chat"}
                  {isCompleted && " · Completed"}
                </div>
              </div>
            </>
          ) : (
            <span className={styles.topBarFallbackLabel}>AI Chat Assistant</span>
          )}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              className="btn-outline-custom"
              style={{ padding: "6px 14px", fontSize: 12 }}
              onClick={() => navigate("/candidate/dashboard")}
            >
              <i className="bi bi-arrow-left me-1" /> Back
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className={styles.chatMessagesContainer}>
          {!activeId ? (
            <div className={styles.emptyStateContainer}>
              <i className="bi bi-chat-dots" style={{ fontSize: 48, opacity: 0.3 }} />
              <h3 className={styles.emptyStateHeading}>AI Chat Assistant</h3>
              <p className={styles.emptyStateText}>Start a new conversation for general career chat or a job-specific mock interview.</p>
              <button className="btn-primary-custom" style={{ padding: "10px 28px", fontSize: 14 }} onClick={openNewChat}>
                <i className="bi bi-plus-lg me-2" />New Conversation
              </button>
            </div>
          ) : loadingMessages ? (
            <LoadingState message="Loading messages..." />
          ) : messages.length === 0 ? (
            <div className={styles.emptyConversationPlaceholder}>Start the conversation by typing a message below.</div>
          ) : (
            <div className={styles.messageListWrapper}>
              {messages.map((m, i) => (
                <div
                  key={m._id || i}
                  style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}
                >
                  <div
                    className={m.role === "user" ? styles.messageBubbleUser : styles.messageBubbleAssistant}
                  >
                    {m.content}
                    {m.failed && (
                      <div className={styles.failedMessageText}>Failed to send. Try again.</div>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className={styles.sendingPlaceholder}>
                  <span style={{ animation: "blink 1.4s infinite both" }}>.</span>
                  <span style={{ animation: "blink 1.4s infinite both", animationDelay: "0.2s" }}>.</span>
                  <span style={{ animation: "blink 1.4s infinite both", animationDelay: "0.4s" }}>.</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        {activeId && !isCompleted && (
          <div className={styles.inputWrapper}>
            <div className={styles.inputWrapperInner}>
              <div style={{ flex: 1, position: "relative" }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  rows={1}
                  disabled={sending}
                  className={styles.textarea}
                  style={{
                    background: sending ? "#F9FAFB" : "#fff",
                  }}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                  }}
                />
              </div>
              <button
                className={`btn ${styles.sendBtn}`}
                onClick={handleSend}
                disabled={!input.trim() || sending}
                style={{
                  background: input.trim() && !sending ? "var(--primary)" : "#E5E7EB",
                  color: input.trim() && !sending ? "#fff" : "#9CA3AF",
                }}
              >
                <i className="bi bi-send-fill" />
              </button>
            </div>
          </div>
        )}

        {/* New Chat Modal */}
        {showNewChat && (
          <div className={styles.modalOverlay} onClick={() => setShowNewChat(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h3 className={styles.modalHeader}>New Conversation</h3>
              <div className={styles.modalSection}>
                <label className={styles.modalLabel}>Type</label>
                <div style={{ display: "flex", gap: 10 }}>
                  <label
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: `2px solid ${newChatType === "general" ? "var(--primary)" : "var(--border)"}`,
                      cursor: "pointer",
                      textAlign: "center",
                      fontSize: 13,
                      fontWeight: 600,
                      background: newChatType === "general" ? "var(--primary-bg)" : "#fff",
                    }}
                  >
                    <input
                      type="radio"
                      name="chatType"
                      value="general"
                      checked={newChatType === "general"}
                      onChange={() => setNewChatType("general")}
                      style={{ display: "none" }}
                    />
                    <i className="bi bi-chat-dots me-2" />
                    General Chat
                  </label>
                  <label
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: `2px solid ${newChatType === "mock_interview" ? "var(--primary)" : "var(--border)"}`,
                      cursor: "pointer",
                      textAlign: "center",
                      fontSize: 13,
                      fontWeight: 600,
                      background: newChatType === "mock_interview" ? "var(--primary-bg)" : "#fff",
                    }}
                  >
                    <input
                      type="radio"
                      name="chatType"
                      value="mock_interview"
                      checked={newChatType === "mock_interview"}
                      onChange={() => setNewChatType("mock_interview")}
                      style={{ display: "none" }}
                    />
                    <i className="bi bi-person-workspace me-2" />
                    Mock Interview
                  </label>
                </div>
              </div>

              {newChatType === "mock_interview" && (
                <div className={styles.modalSection} style={{ marginBottom: 20 }}>
                  <label className={styles.modalLabel}>Select a Job</label>
                  <select
                    className="form-select"
                    value={newChatJobId}
                    onChange={(e) => setNewChatJobId(e.target.value)}
                    style={{ borderRadius: 10, fontSize: 13, padding: "10px 12px" }}
                  >
                    <option value="">-- Select a job --</option>
                    {appliedJobs
                      .filter((app) => app.jobId)
                      .map((app) => (
                        <option key={app.jobId} value={app.jobId}>
                          {app.jobTitle}
                        </option>
                      ))}
                  </select>
                  {appliedJobs.length === 0 && (
                    <p className={styles.modalHelperText}>No job applications found. Apply to a job first.</p>
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  className="btn-outline-custom"
                  style={{ padding: "8px 20px", fontSize: 13 }}
                  onClick={() => setShowNewChat(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary-custom"
                  style={{ padding: "8px 20px", fontSize: 13 }}
                  disabled={creating || (newChatType === "mock_interview" && !newChatJobId)}
                  onClick={handleNewChat}
                >
                  {creating ? "Creating..." : "Start"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className={styles.deleteModalOverlay} onClick={() => setDeleteTarget(null)}>
            <div className={styles.deleteModalContent} onClick={(e) => e.stopPropagation()}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  margin: "0 auto 16px",
                  background: "#FEE2E2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i className="bi bi-trash" style={{ color: "#DC2626", fontSize: 20 }} />
              </div>
              <h3 className={styles.deleteTitle}>Delete Conversation</h3>
              <p className={styles.deleteMessage}>
                Are you sure you want to delete "<strong>{deleteTarget.title}</strong>"? This cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button
                  className="btn-outline-custom"
                  style={{ padding: "8px 20px", fontSize: 13 }}
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting === deleteTarget.id}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary-custom"
                  style={{ padding: "8px 20px", fontSize: 13, background: "#DC2626", borderColor: "#DC2626" }}
                  disabled={deleting === deleteTarget.id}
                  onClick={confirmDelete}
                >
                  {deleting === deleteTarget.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Keyframes */}
        <style>{`
          @keyframes blink {
            0%, 80%, 100% { opacity: 0; }
            40% { opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}
