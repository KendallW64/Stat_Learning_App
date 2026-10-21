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
