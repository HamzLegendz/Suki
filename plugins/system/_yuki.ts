import type { PluginHandler } from "@yuki/types";
import { ai } from "plugins/system/ai_utils/yuki";
import {
  getSession,
  updateSession,
  clearSession,
  setPersonality
} from "plugins/system/ai_utils/yukiSessionManager";

const chatbotState: { [chatId: string]: boolean } = {};

let handler: PluginHandler = {
  name: "Yuki AI Chat",
  description: "AI chatbot with Yuki's cheerful and friendly personality",
  tags: ["public"],
  cmd: ["yuki"],
  exec: async (m, { conn, text, isOwner }) => {
    if (!text) {
      return m.reply(
        `Hello *${m.name}*! I'm Yuki 😊\n\n` +
        `I'm an AI assistant ready to help you! ✨\n\n` +
        `*Available commands (Owner only):*\n` +
        `• ${handler.cmd[0]} on - Enable auto reply\n` +
        `• ${handler.cmd[0]} off - Turn off auto reply\n` +
        `• ${handler.cmd[0]} clear - Clear chat history\n` +
        `• ${handler.cmd[0]} personality [text] - Set custom personality\n` +
        `• ${handler.cmd[0]} [message] - Chat with Yuki\n\n` +
        `Tag or reply to my message to chat with me! 🥰`
      );
    }

    const command = text.toLowerCase().split(' ')[0];
    const args = text.slice(command!!.length).trim();
    if (command === "on") {
      if (!isOwner) {
        return m.reply("⚠️ Sorry, only the owner can activate/deactivate Yuki.");
      }
      chatbotState[m.chat] = true;
      return m.reply("✅ Yuki has been activated! I will now respond when tagged or replied to! 😊");
    }

    if (command === "off") {
      if (!isOwner) {
        return m.reply("⚠️ Sorry, only the owner can activate/deactivate Yuki.");
      }
      chatbotState[m.chat] = false;
      return m.reply("✅ Yuki auto reply has been disabled. Use the command to chat with me, okay! 😴");
    }

    if (command === "clear") {
      clearSession(m.sender);
      return m.reply("✅ Your chat history with Yuki has been deleted! Let's start a new conversation 🌟");
    }

    if (command === "personality") {
      if (!isOwner) {
        return m.reply("⚠️ Sorry, only the owner can change Yuki's personality.");
      }

      if (!args) {
        return m.reply("❌ Give a description of the desired personality!\n\nExample: .yuki personality You are a professional and formal assistant");
      }

      setPersonality(m.sender, args);
      clearSession(m.sender);
      return m.reply("✅ Yuki's personality has been changed! Her chat history has also been reset.");
    }

    try {
      const session = getSession(m.sender, isOwner);
      const messages = [
        { role: 'system' as const, content: session.personality },
        ...session.chatHistory
      ];

      const response = await ai(text, messages);

      updateSession(m.sender, 'user', text);
      updateSession(m.sender, 'assistant', response);

      await m.reply(response.trim());
    } catch (error) {
      console.error("Yuki AI Error:", error);
      await m.reply("❌ Sorry, I'm having trouble. Please try again later! 😔");
    }
  },
  before: async (m, { conn, isOwner }) => {
    if (m.sender === conn?.user?.jid) return false;

    const isMentioned = m.mentionedJid && m.mentionedJid.includes(conn?.user?.lid as string);
    const isReply = m.quoted && m.quoted.sender === conn?.user?.lid;

    if (!isMentioned && !isReply) return false;

    const isAutoReplyEnabled = chatbotState[m.chat] === true;

    if (!isAutoReplyEnabled) return false;

    let userText = m.text || "";
    if (isMentioned) {
      userText = userText.replace(/@\d+/g, '').trim();
    }

    if (!userText) {
      await m.reply("Hello! How can I help you? 😆");
      return true;
    }

    try {
      const session = getSession(m.sender, isOwner);
      const messages = [
        { role: 'system' as const, content: session.personality },
        ...session.chatHistory
      ];

      const response = await ai(userText, messages);

      updateSession(m.sender, 'user', userText);
      updateSession(m.sender, 'assistant', response);

      await m.reply(response.trim());
      return true;
    } catch (error) {
      console.error("Yuki AI Before Error:", error);
      await m.reply("❌ Sorry, I'm having trouble. Please try again later! 😔");
      return true;
    }
  }
}

export default handler;