import { useState, useEffect, useRef } from "react";
import { getContacts, getMessages, sendMessage, markMessagesAsRead } from "../../api/messagesApi";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { FiSend, FiSearch, FiMessageSquare } from "react-icons/fi";
import { formatDateTime } from "../../utils/aqiHelpers";

export default function ChatPage() {
    const { user } = useAuth();
    const { socket } = useSocket() || {};
    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchContacts();
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message) => {
            // If the message belongs to the currently open chat, append it
            if (selectedContact && (message.sender === selectedContact._id || message.receiver === selectedContact._id)) {
                setMessages((prev) => [...prev, message]);
                
                // If we are receiving it, mark it as read
                if (message.sender === selectedContact._id) {
                    markMessagesAsRead(selectedContact._id);
                }
            } else {
                // Otherwise, refresh contacts to show unread badge
                fetchContacts();
            }
        };

        socket.on("newMessage", handleNewMessage);
        return () => {
            socket.off("newMessage", handleNewMessage);
        };
    }, [socket, selectedContact]);

    useEffect(() => {
        if (selectedContact) {
            fetchMessages(selectedContact._id);
            markMessagesAsRead(selectedContact._id).then(() => fetchContacts());
        }
    }, [selectedContact]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchContacts = async () => {
        try {
            const res = await getContacts();
            if (res.data.success) {
                setContacts(res.data.contacts);
            }
        } catch (err) {
            console.error("Failed to fetch contacts", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (contactId) => {
        try {
            const res = await getMessages(contactId);
            if (res.data.success) {
                setMessages(res.data.messages);
            }
        } catch (err) {
            console.error("Failed to fetch messages", err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedContact) return;

        const tempMessage = {
            _id: Date.now().toString(),
            sender: user._id,
            receiver: selectedContact._id,
            content: newMessage,
            createdAt: new Date().toISOString()
        };

        setMessages((prev) => [...prev, tempMessage]);
        setNewMessage("");

        try {
            const res = await sendMessage({ receiverId: selectedContact._id, content: tempMessage.content });
            if (res.data.success) {
                // Replace temp message with real one
                setMessages((prev) => prev.map(m => m._id === tempMessage._id ? res.data.message : m));
                fetchContacts(); // Update last message
            }
        } catch (err) {
            console.error("Failed to send message", err);
            // Optionally remove temp message or show error
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const visibleContacts = user?.role === "OFFICER" 
        ? contacts.filter(c => c.role === "SUPER_ADMIN" || c.city === user.city)
        : contacts;

    const filteredContacts = visibleContacts.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <div className="page-loader"><div className="loader-spinner"></div></div>;

    return (
        <div className="page-container" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 100px)", padding: 0 }}>
            <div className="page-header" style={{ padding: "24px 24px 0 24px", marginBottom: 16 }}>
                <h1><FiMessageSquare /> Messages</h1>
                <p style={{ color: "var(--text-secondary)" }}>Communicate securely with officials and administrators.</p>
            </div>

            <div className="glass-panel" style={{ display: "flex", flex: 1, margin: "0 24px 24px 24px", overflow: "hidden" }}>
                {/* Sidebar */}
                <div style={{ width: 320, borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column" }}>
                    <div style={{ padding: 16, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <div className="search-bar" style={{ position: "relative" }}>
                            <FiSearch style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Search contacts..." 
                                style={{ paddingLeft: 36, width: "100%" }}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div style={{ flex: 1, overflowY: "auto" }}>
                        {filteredContacts.length === 0 ? (
                            <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>No contacts found.</div>
                        ) : (
                            filteredContacts.map(contact => (
                                <div 
                                    key={contact._id} 
                                    onClick={() => setSelectedContact(contact)}
                                    style={{ 
                                        padding: 16, 
                                        borderBottom: "1px solid rgba(255,255,255,0.02)", 
                                        cursor: "pointer",
                                        background: selectedContact?._id === contact._id ? "rgba(255,255,255,0.05)" : "transparent",
                                        transition: "background 0.2s"
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                        <strong style={{ fontSize: "0.95rem" }}>{contact.name}</strong>
                                        {contact.unreadCount > 0 && (
                                            <span style={{ background: "var(--primary)", color: "white", fontSize: "0.75rem", padding: "2px 6px", borderRadius: 10, fontWeight: "bold" }}>
                                                {contact.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: 180 }}>
                                            {contact.role === "SUPER_ADMIN" ? "Administrator" : contact.city}
                                        </span>
                                        {contact.lastMessageTime && (
                                            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                                {new Date(contact.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                    {contact.lastMessage && (
                                        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 8, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                            {contact.lastMessage}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "rgba(0,0,0,0.1)" }}>
                    {selectedContact ? (
                        <>
                            <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: 12 }}>
                                <div className="user-avatar" style={{ width: 40, height: 40, background: "var(--primary)" }}>
                                    {selectedContact.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{selectedContact.name}</h3>
                                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                        {selectedContact.role === "SUPER_ADMIN" ? "System Admin" : `Ground Officer - ${selectedContact.city}`}
                                    </span>
                                </div>
                            </div>

                            <div style={{ flex: 1, padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
                                {messages.length === 0 ? (
                                    <div style={{ margin: "auto", color: "var(--text-muted)", textAlign: "center" }}>
                                        <FiMessageSquare size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
                                        <p>No messages yet. Start the conversation!</p>
                                    </div>
                                ) : (
                                    messages.map((msg, index) => {
                                        const isMe = msg.sender === user._id;
                                        return (
                                            <div key={msg._id || index} style={{ 
                                                alignSelf: isMe ? "flex-end" : "flex-start",
                                                maxWidth: "70%",
                                                display: "flex",
                                                flexDirection: "column"
                                            }}>
                                                <div style={{
                                                    background: isMe ? "var(--primary)" : "rgba(255,255,255,0.1)",
                                                    color: "white",
                                                    padding: "12px 16px",
                                                    borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                                                    fontSize: "0.95rem",
                                                    lineHeight: 1.4
                                                }}>
                                                    {msg.content}
                                                </div>
                                                <span style={{ 
                                                    fontSize: "0.7rem", 
                                                    color: "var(--text-muted)", 
                                                    marginTop: 4, 
                                                    alignSelf: isMe ? "flex-end" : "flex-start" 
                                                }}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        )
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
                                <form onSubmit={handleSendMessage} style={{ display: "flex", gap: 12 }}>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="Type your message..." 
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        style={{ flex: 1, borderRadius: 24, padding: "12px 20px" }}
                                    />
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary" 
                                        disabled={!newMessage.trim()}
                                        style={{ borderRadius: "50%", width: 46, height: 46, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                                    >
                                        <FiSend size={18} style={{ transform: "translateX(-2px)" }} />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div style={{ margin: "auto", color: "var(--text-muted)", textAlign: "center" }}>
                            <FiMessageSquare size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                            <h2>Select a conversation</h2>
                            <p>Choose an official from the sidebar to start messaging.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
