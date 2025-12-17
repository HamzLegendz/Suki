import type { BaileysEventMap } from "baileys"
import { smsg } from "./libs/serialize";
import type { ExtendedWAMessage } from "./types/extendWAMessage";
import util from "node:util";

const isNumber = (x: number) => typeof x === 'number' && !isNaN(x)
const delay = (ms: number) => isNumber(ms) && new Promise(resolve => setTimeout(resolve, ms))

export async function handler(chatUpdate: BaileysEventMap["messages.upsert"]) {
  if (!chatUpdate) return;
  this.pushMessage(chatUpdate.messages);
  let m = chatUpdate.messages[chatUpdate.messages.length - 1] as ExtendedWAMessage;
  if (!m) return;
  if (global.db.data != null) await loadDatabase();
  try {
    m = smsg(this, m) || m
    if (!m) return;
    m.exp = 0;
    m.limit = false;
    try {
      /**
       * Inside this trycatch is the implementation for databases 
       *  You can delete or add your data in databases here.
       *   But be careful because it will have an impact on 
       *   e.g: global.db.data.some_data
       */
      let user = global.db.data.users[m.sender];
      if (typeof user !== 'object') global.db.data.users[m.sender] = {};
      if (user) {
        if (!isNumber(user.exp)) user.exp = 0;
        if (!isNumber(user.limit)) user.limit = 100;
        if (!isNumber(user.level)) user.level = 0;
        if (!('registered' in user)) user.registered = false;
        if (!user.registered) {
          if (!("name" in user)) user.name = m.name;
          if (!isNumber(user.age)) user.age = -1;
          if (!isNumber(user.regTime)) user.regTime = -1;
          if (!isNumber(user.limit)) user.limit = 50;
        }
        if (!isNumber(user.afk)) user.afk = -1;
        if (!('afkReason' in user)) user.afkReason = '';
        if (!('banned' in user)) user.banned = false;
        if (!('bannedReason' in user)) user.bannedReason = '';
        if (!('premium' in user)) user.premium = false;
        if (!isNumber(user.premiumDate)) user.premiumDate = 0;
      } else global.db.data.users[m.sender] = {
        name: m.name,
        level: 0,
        age: -1,
        regTime: -1,
        exp: 0,
        limit: 100,
        registered: false,
        afk: -1,
        afkReason: '',
        banned: false,
        bannedReason: '',
        premium: false,
      }

      let chat = global.db.data.chats[m.chat]
      if (typeof chat !== 'object') global.db.data.chats[m.chat] = {}
      if (chat) {
        if (!('isBanned' in chat)) chat.isBanned = false
        if (!('welcome' in chat)) chat.welcome = true
        if (!('autoread' in chat)) chat.autoread = false
        if (!('detect' in chat)) chat.detect = false
        if (!('sWelcome' in chat)) chat.sWelcome = `Selamat Datang @user`
        if (!('sBye' in chat)) chat.sBye = `Selamat Tinggal @user`
        if (!('sPromote' in chat)) chat.sPromote = '@user telah di promote'
        if (!('sDemote' in chat)) chat.sDemote = '@user telah di demote'
        if (!('delete' in chat)) chat.delete = true
        if (!('antiVirtex' in chat)) chat.antiVirtex = false
        if (!('antiLink' in chat)) chat.antiLink = false
        if (!('tikauto' in chat)) chat.tikauto = false
        if (!('captcha' in chat)) chat.captcha = false
        if (!('antifoto' in chat)) chat.antiFoto = false
        if (!('antividio' in chat)) chat.antiVideo = false
        if (!('autoJpm' in chat)) chat.autoJpm = false
        if (!('antiPorn' in chat)) chat.antiPorn = false
        if (!('antiBot' in chat)) chat.antiBot = true
        if (!('antiSpam' in chat)) chat.antiSpam = false
        if (!('freply' in chat)) chat.freply = false
        if (!('simi' in chat)) chat.simi = false
        if (!('ai' in chat)) chat.ai = false
        if (!('ngetik' in chat)) chat.ngetik = true
        if (!('autoVn' in chat)) chat.autoVn = false
        if (!('antiSticker' in chat)) chat.antiSticker = false
        if (!('stiker' in chat)) chat.stiker = false
        if (!('antiBadword' in chat)) chat.antiBadword = false
        if (!('antiToxic' in chat)) chat.antiToxic = false
        if (!('viewonce' in chat)) chat.viewonce = false
        if (!('useDocument' in chat)) chat.useDocument = false
        if (!('antiToxic' in chat)) chat.antiToxic = false
        if (!isNumber(chat.expired)) chat.expired = 0
      } else global.db.data.chats[m.chat] = {
        isBanned: false,
        welcome: true,
        autoread: false,
        simi: false,
        ai: false,
        ngetik: true,
        autoVn: false,
        stiker: false,
        antiSticker: false,
        antiBadword: false,
        antiToxic: false,
        antiSpam: false,
        antiBot: true,
        detect: false,
        autoJpm: false,
        sWelcome: '',
        sBye: '',
        sPromote: '@user telah di promote!',
        sDemote: '@user telah di demote',
        delete: true,
        antiLink: false,
        tikauto: false,
        captcha: false,
        antifoto: false,
        antividio: false,
        antiPorn: false
      }
      let settings = global.db.data.settings[this.user.jid]
      if (typeof settings !== 'object') global.db.data.settings[this.user.jid] = {}
      if (settings) {
        if (!('self' in settings)) settings.self = false
        if (!('autoread' in settings)) settings.autoread = false
        if (!('composing' in settings)) settings.composing = true
        if (!('restrict' in settings)) settings.restrict = true
        if (!('autorestart' in settings)) settings.autorestart = true
        if (!('gconly' in settings)) settings.gconly = true
        if (!('restartDB' in settings)) settings.restartDB = 0
        if (!isNumber(settings.status)) settings.status = 0
        if (!('anticall' in settings)) settings.anticall = true
        if (!('clear' in settings)) settings.clear = true
        if (!isNumber(settings.clearTime)) settings.clearTime = 0
        if (!('freply' in settings)) settings.freply = true
        if (!('akinator' in settings)) settings.akinator = {}
      } else global.db.data.settings[this.user.jid] = {
        self: false,
        autoread: false,
        restrict: true,
        autorestart: true,
        composing: true,
        restartDB: 0,
        gconly: true,
        status: 0,
        anticall: true,
        clear: true,
        clearTime: 0,
        freply: true,
        akinator: {}
      }
    } catch (e) {
      console.error(e)
    }

    if (opts["nyimak"]) return;
    if (opts["self"] && !m.fromMe && !global.db.data.users[m.sender].moderator) return
    if (opts["autoread"]) await this.readMessages([m.key]);
    if (opts["pconly"] && m.chat.endsWith('g.us')) return;
    if (opts["gconly"] && !m.fromMe && !m.chat.endsWith("g.us") && !global.db.data.users[m.sender].premium) return conn.sendMessage(m.chat, { text: `Bot Access to Private Chat Denied` }, { quoted: m });
    if (opts['swonly'] && m.chat !== 'status@broadcast') return;
    if (typeof m.text !== 'string') m.text = '';
    const body = typeof m.text == 'string' ? m.text : false;
    const isROwner = [conn.decodeJid(this.user.id), ...global.owner.map(([number, _]) => number)].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender);
    const isOwner = isROwner || m.fromMe;
    const isMods = isOwner || global.mods.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender);
    const isPrems = isROwner || global.db.data.users[m.sender].premiumTime > 0;
    const isBans = global.db.data.users[m.sender].banned;

    if (isROwner) {
      db.data.users[m.sender].premium = true;
      db.data.users[m.sender].premiumDate = "infinity";
      db.data.users[m.sender].limit = "infinity";
      db.data.users[m.sender].moderator = true;
    }

    if (opts['queque'] && m.text && !(isMods || isPrems)) {
      let queque = this.msgqueque, time = 1000 * 5
      const previousID = queque[queque.length - 1]
      queque.push(m.id || m.key.id)
      setInterval(async function() {
        if (queque.indexOf(previousID) === -1) clearInterval(this)
        else await delay(time)
      }, time)
    }

    if (m.isBaileys) return;
    m.exp += Math.ceil(Math.random() * 10);
    let usedPrefix: any
    let _user = global.db.data && global.db.data.users && global.db.data.users[m.sender]
    const groupMetadata = (m.isGroup ? (conn.chats[m.chat] || {}).metadata : {}) || {}
    const participants = (m.isGroup ? groupMetadata.participants : []) || []
    const user = (m.isGroup ? participants.find(u => conn.decodeJid(u.id) === m.sender) : {}) || {}
    const bot = (m.isGroup ? participants.find(u => conn.decodeJid(u.id) == this.user.jid) : {}) || {};
    const isRAdmin = user && user.admin == 'superadmin' || false
    // is the user admin?
    const isAdmin = isRAdmin || user && user.admin == 'admin' || false
    // Is the bot Admib?
    const isBotAdmin = bot && bot.admin || false
    for (let name in global.plugins) {
      let plugin = global.plugins[name];
      if (!plugin) continue;
      if (plugin.disabled) {
        await m.reply("Sorry :( This command is currently disabled by the owner");
        continue;
      }
      if (typeof plugin.all === "function") {
        try {
          await plugin.all.call(this, m, chatUpdate);
        } catch (e) {
          console.error(e)
        }
      }

      if (!opts['restrict']) if (plugin.tags && plugin.tags.includes('admin')) {
        continue
      }

      const str2Regex = (str: string) => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
      let _prefix = plugin.customPrefix ? plugin.customPrefix : conn.prefix ? conn.prefix : global.prefix;
      const usePrefix = plugin.usePrefix !== false;
      let match: any;

      if (usePrefix) {
        match = (_prefix instanceof RegExp ? // RegExp Mode?
          [[_prefix.exec(m.text), _prefix]] :
          Array.isArray(_prefix) ? // Array?
            _prefix.map(p => {
              let re = p instanceof RegExp ? // RegExp in Array?
                p :
                new RegExp(str2Regex(p))
              return [re.exec(m.text), re]
            }) :
            typeof _prefix === 'string' ? // String?
              [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]] :
              // @ts-ignore
              [[[], new RegExp]]
        ).find(p => p[1]);
      } else {
        match = [[m.text, new RegExp("^")]];
      }

      if (typeof plugin.before === 'function') if (await plugin.before.call(this, m, {
        match,
        conn: this,
        participants,
        groupMetadata,
        user,
        bot,
        isROwner,
        isOwner,
        isRAdmin,
        isAdmin,
        isBotAdmin,
        isPrems,
        isBans,
        chatUpdate,
      })) continue;
      if (typeof plugin.exec !== "function") continue;
      let noPrefix: any, command: string, args: any, _args: any, text: string;

      if (usePrefix) {
        if ((usedPrefix = (match[0] || '')[0])) {
          noPrefix = m.text.replace(usedPrefix, '')
            ;[command, ...args] = noPrefix.trim().split` `.filter((v: any) => v)
          _args = noPrefix.trim().split` `.slice(1)
          text = _args.join` `
        } else {
          continue; // Skip if prefix is required but not found
        }
      } else {
        noPrefix = m.text;
        [command, ...args] = noPrefix.trim().split` `.filter((v: any) => v)
        _args = noPrefix.trim().split` `.slice(1)
        text = _args.join` `
        usedPrefix = ''; // Empty prefix
      }

      command = (command || '').toLowerCase()
      let fail = plugin.fail || global.dfail
      let isAccept = plugin.cmd instanceof RegExp ? // RegExp Mode?
        plugin.cmd.test(command) :
        Array.isArray(plugin.cmd) ? // Array?
          plugin.cmd.some((cmd: any) => cmd instanceof RegExp ? // RegExp in Array?
            cmd.test(command) :
            cmd === command
          ) :
          typeof plugin.cmd === 'string' ? // String?
            plugin.cmd === command :
            false

      if (!isAccept) continue
      m.plugin = name
      if (m.chat in global.db.data.chats || m.sender in global.db.data.users) {
        let chat = global.db.data.chats[m.chat]
        let user = global.db.data.users[m.sender]
        if (name != 'owner/unbanchat.ts' && chat && chat.isBanned) return
        if (name != 'owner/unbanuser.ts' && user && user.banned) return
      }
      if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) {
        fail('owner', m, this)
        continue
      }
      if (plugin.rowner && !isROwner) { // Real Owner
        fail('rowner', m, this)
        continue
      }
      if (plugin.owner && !isOwner) { // Number Owner
        fail('owner', m, this)
        continue
      }
      if (plugin.mods && !isMods) { // Moderator
        fail('mods', m, this)
        continue
      }
      if (plugin.premium && !isPrems) { // Premium
        fail('premium', m, this)
        continue
      }
      if (plugin.banned && !isBans) { // Banned
        fail('banned', m, this)
        continue
      }
      if (plugin.group && !m.isGroup) { // Group Only
        fail('group', m, this)
        continue
      } else if (plugin.botAdmin && !isBotAdmin) { // You Admin
        fail('botAdmin', m, this)
        continue
      } else if (plugin.admin && !isAdmin) { // User Admin
        fail('admin', m, this)
        continue
      }
      if (plugin.private && m.isGroup) { // Private Chat Only
        fail('private', m, this)
        continue
      }
      if (plugin.register == true && _user.registered == false) { // Butuh daftar?
        fail('unreg', m, this)
        continue
      }
      m.isCommand = true
      // This is xp user, Where only run command 
      //  user gets 17 exp
      let xp = 'exp' in plugin ? parseInt(plugin.exp) : 17 // XP Earning per command
      m.exp += xp;
      if (!isPrems && plugin.limit && global.db.data.users[m.sender].limit < plugin.limit * 1) {
        this.reply(m.chat, "Your bot usage limit has expired and will be reset at 00.00 WIB (Indonesian Time)\nTo get more limit upgrade to premium send *.premium*", m);
      }

      if (plugin.level > _user.level) {
        this.reply(m.chat, `${plugin.level} level is required to use this command. Your level is ${_user.level}`, m)
        continue // If the level has not been reached
      }
      let extra = {
        match,
        usedPrefix,
        noPrefix,
        _args,
        args,
        body,
        command,
        text,
        conn: this,
        participants,
        groupMetadata,
        user,
        bot,
        isROwner,
        isOwner,
        isRAdmin,
        isAdmin,
        isBotAdmin,
        isPrems,
        isBans,
        chatUpdate,
      }
      try {
        await plugin.exec.call(this, m, extra);
        if (!isPrems) m.limit = m.limit || plugin.limit || true;
      } catch (e: any) {
        m.error = e
        console.error(e)
        if (e) {
          let text = util.format(e)
          for (let key of Object.values(global.APIKeys))
            // @ts-ignore
            text = text.replace(new RegExp(key, 'g'), 'DitzDev')
          if (e.name) for (let [jid] of global.owner.filter(([number, _, isDeveloper]) => isDeveloper && number)) {
            let data = (await this.onWhatsApp(jid))[0] || {}
            if (data.exists) conn.reply(data.jid, `*Plugin:* ${m.plugin}\n*Sender:* ${m.sender}\n*Chat:* ${m.chat}\n*Command:* ${usedPrefix}${command} ${args.join(' ')}\n\n\`\`\`${text}\`\`\``, m)
          }
          conn.reply(m.chat, text, m)
        }
      } finally {
        if (typeof plugin.after === 'function') {
          try {
            await plugin.after.call(this, m, extra)
          } catch (e) {
            console.error(e)
          }
        }
      }
      break
    }
  } catch (e) {
    console.error(e);
  } finally {
    if (opts['queque'] && m.text) {
      const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id)
      if (quequeIndex !== -1) this.msgqueque.splice(quequeIndex, 1)
    }

    let user, stats = global.db.data.stats
    if (m) {
      if (m.sender && (user = global.db.data.users[m.sender])) {
        user.exp += m.exp
        user.limit -= m.limit * 1
      }

      let stat
      if (m.plugin) {
        let now = + new Date
        if (m.plugin in stats) {
          stat = stats[m.plugin]
          if (!isNumber(stat.total)) stat.total = 1
          if (!isNumber(stat.success)) stat.success = m.error != null ? 0 : 1
          if (!isNumber(stat.last)) stat.last = now
          if (!isNumber(stat.lastSuccess)) stat.lastSuccess = m.error != null ? 0 : now
        } else stat = stats[m.plugin] = {
          total: 1,
          success: m.error != null ? 0 : 1,
          last: now,
          lastSuccess: m.error != null ? 0 : now
        }
        stat.total += 1
        stat.last = now
        if (m.error == null) {
          stat.success += 1
          stat.lastSuccess = now
        }
      }
    }
    try {
      await (await import(`./libs/print.ts?update=${Date.now()}`)).default(m, this);
    } catch (e) {
      console.log(m, m.quoted, e)
    }

    if (opts["autoread"])
      await this.chatRead(
        m.chat,
        m.isGroup ? m.sender : undefined,
        m.id || m.key.id,
      ).catch(() => { });
  }
}
