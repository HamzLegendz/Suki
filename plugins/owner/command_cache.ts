import type { PluginHandler } from "@yuki/types";

let handler: PluginHandler = {
  name: "Reload Command Cache",
  description: "Rebuild command cache (admin only)",
  cmd: ["reloadcache", "cachereload"],
  owner: true,
  exec: async (m, { conn }) => {
    const start = Date.now();
    
    commandCache.build(global.plugins);
    
    const stats = commandCache.getStats();
    const elapsed = Date.now() - start;
    
    const message = `✅ *Command Cache Rebuilt*

📊 *Statistics:*
• String commands: ${stats.stringCommands}
• Regex commands: ${stats.regexCommands}
• Total: ${stats.total}

⏱️ Time taken: ${elapsed}ms`;

    await conn!!.sendMessage(m.chat, { text: message }, { quoted: m });
  }
};

export default handler;