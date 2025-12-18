import type { PluginHandler } from "@yuki/types";
import fs from "node:fs"

let handler: PluginHandler = {
  cmd: ["sf", "df"],
  rowner: true,
  exec: async (m, { conn, command, usedPrefix, text }) => {
    if (!text) throw `*• Example:* ${usedPrefix + command!!} *[filename]*`;
    if (command === "sf") {
      if (!m.quoted) throw `*Reply your code*`;

      let filePath = `plugins/${text}.ts`;
      let dir = filePath.split("/").slice(0, -1).join("/");

      if (dir && !fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, m.quoted.text);

      let key = await conn!!.sendMessage(
        m.chat,
        { text: "Saving a code..." },
        { quoted: m },
      );

      await conn!!.sendMessage(
        m.chat,
        {
          text: `Code successfully saved!`,
          edit: key!.key,
        },
        { quoted: m },
      );
    } else if (command === "df") {
      // It just deletes the file 
      // We won't care about the folder
      let path = `plugins/${text}.ts`;
      let key = await conn!!.sendMessage(
        m.chat,
        { text: "Deleted code..." },
        { quoted: m },
      );
      if (!fs.existsSync(path))
        return conn!!.sendMessage(
          m.chat,
          { text: `I can't find the code`, edit: key!!.key },
          { quoted: m },
        );
      fs.unlinkSync(path);
      await conn!!.sendMessage(
        m.chat,
        { text: `Succes deleted file`, edit: key!!.key },
        { quoted: m },
      );
    }
  }
}

export default handler;
