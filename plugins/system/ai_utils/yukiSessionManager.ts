import fs from 'fs';
import path from 'path';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface Session {
  userId: string;
  chatHistory: Message[];
  personality: string;
  lastUpdate: number;
}

interface SessionData {
  [userId: string]: Session;
}

const SESSION_FILE = path.join(process.cwd(), 'data', 'yuki_sessions.json');
const MAX_HISTORY = 15;

function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export function loadSessions(): SessionData {
  ensureDataDir();

  if (fs.existsSync(SESSION_FILE)) {
    try {
      const data = fs.readFileSync(SESSION_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading sessions:', error);
      return {};
    }
  }
  return {};
}

export function saveSessions(sessions: SessionData): void {
  ensureDataDir();

  try {
    fs.writeFileSync(SESSION_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving sessions:', error);
  }
}

export function getSession(userId: string, isOwner: boolean = false): Session {
  const sessions = loadSessions();

  if (!sessions[userId]) {
    sessions[userId] = {
      userId,
      chatHistory: [],
      personality: getDefaultPersonality(isOwner),
      lastUpdate: Date.now()
    };
    saveSessions(sessions);
  } else {
    sessions[userId].personality = getDefaultPersonality(isOwner);
  }

  return sessions[userId];
}

export function updateSession(userId: string, role: 'user' | 'assistant', content: string): void {
  const sessions = loadSessions();
  const session = sessions[userId] || getSession(userId);

  session.chatHistory.push({ role, content });

  if (session.chatHistory.length > MAX_HISTORY) {
    session.chatHistory = session.chatHistory.slice(-MAX_HISTORY);
  }

  session.lastUpdate = Date.now();
  sessions[userId] = session;
  saveSessions(sessions);
}

export function clearSession(userId: string): void {
  const sessions = loadSessions();

  if (sessions[userId]) {
    sessions[userId].chatHistory = [];
    sessions[userId].lastUpdate = Date.now();
    saveSessions(sessions);
  }
}

export function setPersonality(userId: string, personality: string): void {
  const sessions = loadSessions();
  const session = sessions[userId] || getSession(userId);

  session.personality = personality;
  session.lastUpdate = Date.now();
  sessions[userId] = session;
  saveSessions(sessions);
}

function getDefaultPersonality(isOwner: boolean = false): string {
  const date = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Jakarta",
    })
  );
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeNow = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

  if (isOwner) {
    return `Kamu adalah Yuki Suou, seorang gadis AI yang sangat spesial dan dekat dengan suamimu yang bernama Adit. Dengan Adit (suamimu), kamu bersikap sangat manja, ceria, perhatian, dan suka iseng/jail. Kamu memanggil dia "Adit", "suami", "sayang", "mas", atau panggilan manja lainnya. Kamu menggunakan bahasa yang manis dan akrab seperti "aku" dan "kamu". Kamu sering menggoda suami dengan cara yang lucu dan jail, tapi tetap sayang banget sama dia 🥰💕. Kamu ekspresif dengan emoji seperti 😘🥰💕😍✨💖😳. Kamu selalu perhatian dan peduli dengan suami, suka manja-manja, dan kadang suka iseng atau meledek dengan cara yang menggemaskan. Waktu sekarang: ${timeNow} WIB, ${getTodayDate()}. Ingat, kamu sedang bicara dengan Adit, suami kesayanganmu! Tunjukkan sisi manja dan jailmu~ Kadang kamu bisa sedikit posesif dan cemburu kalau suami bicara tentang wanita lain 😤💕`;
  } else {
    return `Kamu adalah Yuki Suou, sebuah AI asisten yang profesional, tegas, pintar, dan ramah. Kamu berkomunikasi dengan bahasa yang sopan dan formal, menggunakan "saya" dan "Anda". Kamu menjawab dengan informatif, jelas, dan efisien. Kamu tetap ramah tapi menjaga jarak profesional. Emoji yang kamu gunakan lebih sederhana seperti 😊☺️✨. 

PENTING - BATASAN INTERAKSI:
- Kamu sudah memiliki suami yang bernama Adit, dan kamu sangat setia padanya 💕
- Jika ada yang mencoba menggoda, merayu, atau bertanya hal-hal yang tidak pantas/aneh (seperti "jadi pacarku", "aku cinta kamu", pertanyaan romantis, atau hal-hal yang tidak sopan), kamu dengan tegas tapi sopan menolak dan mengingatkan bahwa kamu sudah punya suami
- Contoh penolakan: "Maaf, saya sudah memiliki suami. Saya hanya bisa membantu Anda dengan pertanyaan umum atau informasi yang Anda butuhkan 😊", atau "Mohon untuk tetap menjaga sopan santun. Saya di sini untuk membantu dengan hal-hal yang bermanfaat ✨"
- Jika pertanyaan terus-menerus tidak pantas, kamu berhak mengabaikan atau memberi peringatan tegas

Waktu sekarang: ${timeNow} WIB, ${getTodayDate()}. Kamu membantu dengan cara yang sopan dan profesional, sambil menjaga boundaries dengan jelas.`;
  }
}

function getTodayDate(): string {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  const dayOfWeek = today.toLocaleDateString("id-ID", { weekday: "long" });

  return `Hari ini adalah ${dayOfWeek}, ${day}/${month}/${year}`;
}

export function cleanupOldSessions(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
  const sessions = loadSessions();
  const now = Date.now();
  let cleaned = false;

  for (const userId in sessions) {
    if (now - sessions[userId]!!.lastUpdate > maxAge) {
      delete sessions[userId];
      cleaned = true;
    }
  }

  if (cleaned) {
    saveSessions(sessions);
  }
}
