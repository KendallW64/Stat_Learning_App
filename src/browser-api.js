import { lessons, identify, practice } from '../shared/lessons.js';
import { grade, round } from '../shared/stats.js';
import { bundled, mlbData, sports } from '../shared/data.js';
import { offlineGuide } from '../shared/tutor.js';

// Mirrors the server contract for static hosting. Never stores syllabus text or chats.
export function createBrowserApi({ storage, student, fetcher = fetch }) {
  const key = `ssa-pages-v1:${student}`;
  function load() {
    const raw = storage.getItem(key);
    if (!raw) return { profile: null, attempts: [] };
    try {
      const value = JSON.parse(raw);
      if (!Array.isArray(value.attempts)) throw new Error();
      return value;
    } catch {
      throw new Error('Saved browser progress could not be read. Export or clear this site’s storage to start a new workspace.');
    }
  }
  function save(value) {
    try { storage.setItem(key, JSON.stringify(value)); }
    catch { throw new Error('Progress could not be saved. Allow site storage or free browser storage, then retry.'); }
  }
  return async function browserApi(path, options = {}) {
    const url = new URL(path, 'https://academy.invalid');
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : {};
    if (url.pathname === '/data') {
      return url.searchParams.get('provider') === 'mlb'
        ? mlbData(fetcher)
        : bundled(url.searchParams.get('sport') || 'Basketball');
    }
    const state = load();
    if (url.pathname === '/profile' && method === 'GET') return state.profile;
    if (url.pathname === '/profile' && method === 'PUT') {
      const { course, topics, sport, team, level } = body;
      if (typeof course !== 'string' || course.trim().length < 2 || course.length > 180 ||
        !Array.isArray(topics) || !topics.length || topics.some(id => !lessons.some(l => l.id === id)) ||
        !sports.includes(sport) || typeof team !== 'string' || team.length > 100 ||
        !['Beginner', 'Intermediate', 'Advanced'].includes(level)) {
        throw new Error('Confirm a course name, at least one topic, a supported sport, team preference, and explanation level.');
      }
      state.profile = { course: course.trim(), topics: [...new Set(topics)], sport, team, level };
      save(state);
      return state.profile;
    }
    if (url.pathname === '/course/identify' && method === 'POST') {
      if (typeof body.text !== 'string' || body.text.length > 30000) throw new Error('Provide course or syllabus text under 30,000 characters.');
      const topics = identify(body.text);
      return { topics, confirmed: false, message: topics.length
        ? 'Topics were found in your text. Confirm them against your syllabus before saving.'
        : 'We cannot verify a curriculum from this course name. Add syllabus text or manually select your topics.' };
    }
    if (url.pathname === '/progress') {
      return { attempts: state.attempts, completed: [...new Set(state.attempts.filter(a => a.correct).map(a => a.topic))] };
    }
    if (url.pathname === '/attempts' && method === 'POST') {
      const { topic, answer } = body;
      if (!lessons.some(l => l.id === topic) || typeof answer !== 'number' || !Number.isFinite(answer)) {
        throw new Error('Choose a valid lesson and enter a finite numeric answer.');
      }
      const p = practice(topic), correct = grade(answer, p.expected);
      state.attempts.unshift({ topic, answer, correct: correct ? 1 : 0, created: new Date().toISOString().replace('T', ' ').slice(0, 19) });
      save(state);
      return { correct, message: correct ? 'Exactly right. You have put the concept into practice.' : `Not quite yet. ${p.hint} Check your arithmetic and try again.`, ...(correct ? { expected: round(p.expected) } : {}) };
    }
    if (url.pathname === '/tutor' && method === 'POST') {
      const { message, topic = 'spread', level = 'Beginner' } = body;
      if (typeof message !== 'string' || !message.trim() || message.length > 2000 || !lessons.some(l => l.id === topic)) {
        throw new Error('Ask a question of up to 2,000 characters about a selected lesson.');
      }
      return { mode: 'Offline teaching guide · no AI model connected', text: offlineGuide({ message, topic, profile: state.profile, level }) };
    }
    throw new Error('This operation is not available in the Pages edition.');
  };
}
