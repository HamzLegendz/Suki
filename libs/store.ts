import type {
  WASocket,
  Contact,
  GroupMetadata
} from 'baileys';

interface ChatData {
  id: string;
  name?: string;
  subject?: string;
  notify?: string;
  isChats?: boolean;
  metadata?: GroupMetadata;
  presences?: string;
  [key: string]: any;
}

interface ExtendedWASocket extends WASocket {
  chats: Record<string, ChatData>;
  decodeJid: (jid: string) => string;
  insertAllGroup?: () => void;
}

type ContactsUpdate = Contact[] | { contacts: Contact[] };

function bind(conn: ExtendedWASocket): void {
  if (!conn.chats) conn.chats = {};

  /**
   * Update contact names to database
   */
  function updateNameToDb(contacts: ContactsUpdate): void {
    if (!contacts) return;

    try {
      const contactList = Array.isArray(contacts) ? contacts : contacts.contacts;

      for (const contact of contactList) {
        const id = conn.decodeJid(contact.id);
        if (!id || id === 'status@broadcast') continue;

        let chats = conn.chats[id];
        if (!chats) chats = conn.chats[id] = { ...contact, id };

        const isGroup = id.endsWith('@g.us');
        conn.chats[id] = {
          ...chats,
          ...contact,
          id,
          ...(isGroup
            ? { subject: (contact as any).subject || contact.name || chats.subject || '' }
            : { name: contact.notify || contact.name || chats.name || chats.notify || '' })
        };
      }
    } catch (e) {
      console.error(e);
    }
  }

  conn.ev.on('contacts.upsert', updateNameToDb);
  conn.ev.on('groups.update', updateNameToDb as any);

  conn.ev.on('group-participants.update', async function updateParticipantsToDb({
    id,
    participants,
    action
  }) {
    if (!id) return;

    const chatId = conn.decodeJid(id);
    if (chatId === 'status@broadcast') return;

    if (!(chatId in conn.chats)) conn.chats[chatId] = { id: chatId };

    const chats = conn.chats[chatId];
    chats!!.isChats = true;

    const groupMetadata = await conn.groupMetadata(chatId).catch(() => null);
    if (!groupMetadata) return;

    chats!!.subject = groupMetadata.subject;
    chats!!.metadata = groupMetadata;
  });

  conn.ev.on('groups.update', async function groupUpdatePushToDb(groupsUpdates) {
    try {
      for (const update of groupsUpdates) {
        const id = conn.decodeJid(update.id as string);
        if (!id || id === 'status@broadcast') continue;

        const isGroup = id.endsWith('@g.us');
        if (!isGroup) continue;

        let chats = conn.chats[id];
        if (!chats) chats = conn.chats[id] = { id };
        chats.isChats = true;

        const metadata = await conn.groupMetadata(id).catch(() => null);
        if (metadata) chats.metadata = metadata;
        if (update.subject || metadata?.subject) {
          chats.subject = update.subject || metadata?.subject;
        }
      }
    } catch (e) {
      console.error(e);
    }
  });

  conn.ev.on('chats.upsert', function chatsUpsertPushToDb(chatsUpsert) {
    try {
      const { id } = chatsUpsert as any;
      if (!id || id === 'status@broadcast') return;

      conn.chats[id] = {
        ...(conn.chats[id] || {}),
        ...chatsUpsert,
        isChats: true
      } as any;

      const isGroup = id.endsWith('@g.us');
      if (isGroup && conn.insertAllGroup) {
        conn.insertAllGroup();
      }
    } catch (e) {
      console.error(e);
    }
  });

  conn.ev.on('presence.update', async function presenceUpdatePushToDb({
    id,
    presences
  }) {
    try {
      const sender = Object.keys(presences)[0] || id;
      const _sender = conn.decodeJid(sender);
      const presence = presences[sender]?.['lastKnownPresence'] || 'composing';

      let chats = conn.chats[_sender];
      if (!chats) chats = conn.chats[_sender] = { id: sender };
      chats.presences = presence;

      if (id.endsWith('@g.us')) {
        let groupChats = conn.chats[id];
        if (!groupChats) {
          const metadata = await conn.groupMetadata(id).catch(() => null);
          if (metadata) {
            groupChats = conn.chats[id] = {
              id,
              subject: metadata.subject,
              metadata,
              isChats: true
            };
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  });
}

export default { bind };
export { bind };
export type { ExtendedWASocket, ChatData };
