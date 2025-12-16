import "./config"
import { Browsers, DisconnectReason, makeCacheableSignalKeyStore, useMultiFileAuthState, type UserFacingSocketConfig } from 'baileys';
import { Low, JSONFile } from 'lowdb';
import path from 'path';
import pino from 'pino';
import { fileURLToPath } from 'url';
import yargs from "yargs";
import { makeWASocket, serialize, protoType } from './libs/serialize';
import chalk from "chalk";
import { tmpdir } from "os";

function filename(metaUrl = import.meta.url) {
  return fileURLToPath(metaUrl)
}

function dirname(metaUrl = import.meta.url) {
  return path.dirname(filename(metaUrl))
}

global.__dirname = dirname();
global.__filename = filename();

serialize();
protoType();

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
global.prefix = new RegExp('^[' + (opts['prefix'] || '‎xzXZ/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + ']')

global.db = new Low(new JSONFile("data/database.json"));
global.loadDatabase = async function loadDatabase() {
  if (db.READ) return new Promise((resolve) => setInterval(async function() {
    if (!db.READ) {
      clearInterval(this)
      resolve(db.data == null ? global.loadDatabase() : db.data)
    }
  }, 1 * 1000))
  if (db.data !== null) return
  db.READ = true
  await db.read().catch(console.error)
  db.READ = null
  db.data = {
    users: {},
    chats: {},
    stats: {},
    msgs: {},
    sticker: {},
    settings: {},
    ...(db.data || {})
  }
}
loadDatabase()

const { state, saveCreds } = await useMultiFileAuthState("Yuki");
const connOptions: UserFacingSocketConfig = {
  logger: pino({ level: "fatal" }),
  browser: Browsers.macOS("Safari"),
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, pino().child({
      level: 'silent',
      stream: 'store'
    })),
  },
  generateHighQualityLinkPreview: true,
  patchMessageBeforeSending: (message) => {
    const requiresPatch = !!(
      message.buttonsMessage
      || message.templateMessage
      || message.listMessage
    );
    if (requiresPatch) {
      message = {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadataVersion: 2,
              deviceListMetadata: {},
            },
            ...message,
          },
        },
      };
    }

    return message;
  },
}

global.conn = makeWASocket(connOptions);
conn.isInit = false

if (!conn.authState.creds.registered) {
  console.warn(chalk.yellow("Processing pairing code, wait a moment..."));
  setTimeout(async () => {
    let code = await conn.requestPairingCode(global.pairing, "DITZDEVS") // set pairing code here
    code = code?.match(/.{1,4}/g)?.join('-') || code
    console.log(chalk.black(chalk.bgGreen(`Your pairing code : `)), chalk.black(chalk.white(code)))
  }, 3000)
}

if (global.db) {
  setInterval(async () => {
    if (global.db.data) await global.db.write().catch(console.error);
    if ((global.support || {}).find) {
      const tmp = [tmpdir(), 'tmp'];
      tmp.forEach(filename => Bun.$`find ${filename} -amin 3 -type f -delete`);
    }
  }, 2000);
}

async function connectionUpdate(update: any) {
  const { receivedPendingNotifications, connection, lastDisconnect, isOnline, isNewLogin } = update;

  if (isNewLogin) {
    conn.isInit = true;
  }

  if (connection == 'connecting') {
    console.log(chalk.redBright('Activating Bot, Please wait a moment...'));
  } else if (connection == 'open') {
    console.log(chalk.green('✅ Connected'));
  }

  if (isOnline == true) {
    console.log(chalk.green('Active Status'));
  } else if (isOnline == false) {
    console.log(chalk.red('Dead Status'));
  }

  if (receivedPendingNotifications) {
    console.log(chalk.yellow('Waiting for New Messages'));
  }

  if (connection == 'close') {
    console.log(chalk.red('Connection lost & trying to reconnect...'));
  }

  if (lastDisconnect && lastDisconnect.error && lastDisconnect.error.output && lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut) {
    console.log(await global.reloadHandler(true));
  }

  if (global.db.data == null) {
    await global.loadDatabase();
  }
}

process.on("uncaughtException", console.error);

let isInit = true
let handler = await import('./handler')
global.reloadHandler = async function(restatConn: boolean) {
  try {
    const Handler = await import(`./handler.ts?update=${Date.now()}`).catch(console.error)
    if (Object.keys(Handler || {}).length) handler = Handler
  } catch (e) {
    console.error(e)
  }

  if (restatConn) {
    const oldChats = global.conn.chats
    try { global.conn.ws.close() } catch { }
    conn.ev.removeAllListeners("messages.upsert")
    global.conn = makeWASocket(connOptions, { chats: oldChats })
    isInit = true
  }

  if (!isInit) {
    conn.ev.off('messages.upsert', conn.handler)
    conn.ev.off('group-participants.update', conn.participantsUpdate)
    conn.ev.off('groups.update', conn.groupsUpdate)
    conn.ev.off('connection.update', conn.connectionUpdate)
    conn.ev.off('creds.update', conn.credsUpdate)
  }

  conn.handler = handler.handler.bind(global.conn)
  conn.connectionUpdate = connectionUpdate.bind(global.conn)
  conn.credsUpdate = saveCreds.bind(global.conn)


  conn.ev.on('messages.upsert', conn.handler)
  conn.ev.on('connection.update', conn.connectionUpdate)
  conn.ev.on('creds.update', conn.credsUpdate)
  isInit = false;
  return true
}

// TODO: Continue to plugin 

await global.reloadHandler();
