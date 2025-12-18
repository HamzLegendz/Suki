import type { PluginHandler } from "@yuki/types";

let handler: PluginHandler = {
  cmd: /^(self|public)/i,
  rowner: true,
  exec: async (m, { conn, command }) => {
    let isPublic = command === "public";

    if (opts["self"] === !isPublic) return conn!!.reply(m.chat, `❌ Bot is already set to ${!isPublic ? "self" : "public"}`, m)
    opts["self"] = !isPublic;
    m.reply(`✅ Bot successfully set to ${!isPublic ? "self" : "public"}`)
  }
}

export default handler;
