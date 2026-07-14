import API from "./axios";

export const getContacts = () => API.get("/messages/contacts");
export const getMessages = (contactId) => API.get(`/messages/${contactId}`);
export const sendMessage = (data) => API.post("/messages", data);
export const markMessagesAsRead = (contactId) => API.put("/messages/read", { contactId });
