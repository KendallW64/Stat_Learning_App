export const isPages = import.meta.env.VITE_DEPLOY_TARGET === 'pages';
let student = localStorage.getItem('ssa-student');
if (!student) {
  student = crypto.randomUUID();
  localStorage.setItem('ssa-student', student);
}

export async function api(path, options = {}) {
  if (isPages) {
    const { createBrowserApi } = await import('./browser-api.js');
    return createBrowserApi({ storage: localStorage, student })(path, options);
  }
  const response = await fetch('/api' + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'x-student-id': student, ...options.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export async function aiClient() {
  const {createAIClient}=await import('./ai-client.js');
  const base=import.meta.env.VITE_AI_API_URL||'';
  return createAIClient({base,enabled:!isPages||Boolean(base),student});
}
