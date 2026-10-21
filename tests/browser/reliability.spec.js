import {test,expect} from '@playwright/test';
import path from 'node:path';
const status=async page=>page.route('**/api/ai/status',r=>r.fulfill({json:{available:true,provider:'Gemini'}}));

test('questions and their replies can be deleted and are excluded from later model context',async({page})=>{
 await status(page);const requests=[];
 await page.route('**/api/ai/tutor',r=>{const body=r.request().postDataJSON();requests.push(body);return r.fulfill({json:{ai:true,mode:'AI tutor · Gemini',text:'Reply to '+body.message}});});
 await page.goto('/');await page.getByRole('button',{name:'AI Statistics Tutor',exact:true}).click();await page.getByRole('checkbox',{name:/Use AI for this conversation/}).check();
 async function ask(message){await page.getByRole('textbox',{name:'Message your stats tutor'}).fill(message);await page.getByRole('button',{name:'Send message',exact:true}).click();await expect(page.getByText('Reply to '+message,{exact:true})).toBeVisible();}
 await ask('First question');await ask('Second question');
 await page.getByRole('button',{name:'Delete question: First question',exact:true}).click();await expect(page.getByText('First question',{exact:true})).toHaveCount(0);await expect(page.getByText('Reply to First question',{exact:true})).toHaveCount(0);await expect(page.getByText('Reply to Second question',{exact:true})).toBeVisible();
 await ask('Third question');expect(JSON.stringify(requests.at(-1).history)).not.toContain('First question');expect(JSON.stringify(requests.at(-1).history)).toContain('Second question');
 await page.getByRole('button',{name:'Clear conversation',exact:true}).click();await expect(page.getByRole('button',{name:/Delete question:/})).toHaveCount(0);await expect(page.getByText('Conversation cleared.',{exact:true})).toBeVisible();
});

test('deleting an in-flight question prevents a late reply from restoring it',async({page})=>{
 await status(page);let release;const delivered=new Promise(resolve=>release=resolve);let requested;
 const requestStarted=new Promise(resolve=>requested=resolve);
 await page.route('**/api/ai/tutor',async r=>{requested();await delivered;try{await r.fulfill({json:{ai:true,mode:'AI tutor · Gemini',text:'Late reply should not appear'}});}catch{}});
 await page.goto('/');await page.getByRole('button',{name:'AI Statistics Tutor',exact:true}).click();await page.getByRole('checkbox',{name:/Use AI for this conversation/}).check();await page.getByRole('textbox',{name:'Message your stats tutor'}).fill('Pending question');await page.getByRole('button',{name:'Send message',exact:true}).click();await requestStarted;
 await page.getByRole('button',{name:'Delete question: Pending question',exact:true}).click();release();
 await expect(page.getByText('Pending question',{exact:true})).toHaveCount(0);await expect(page.getByText('Late reply should not appear',{exact:true})).toHaveCount(0);await expect(page.getByText('Working through your question…')).toHaveCount(0);await expect(page.getByRole('textbox',{name:'Message your stats tutor'})).toBeEnabled();
});

test('live selector fixtures feed player observations into charts, lessons and persistent selection',async({page})=>{
 const requests=[];
 await page.route('**/api/sports?**',r=>{const q=new URL(r.request().url()).searchParams;requests.push(q.toString());
  if(q.get('action')==='teams')return r.fulfill({json:{teams:[{id:'9',name:'Fixture Warriors',shortName:'Warriors'},{id:'2',name:'Fixture Celtics',shortName:'Celtics'}]}});
  if(q.get('action')==='roster')return r.fulfill({json:{players:[{id:'30',name:'Fixture Player',position:'PG'}]}});
  const player=q.get('player');return r.fulfill({json:{id:'fixture-nba',leagueId:'nba',league:'NBA',teamId:q.get('team'),playerId:player,statistic:player?'points':'score',sport:'Basketball',team:'Fixture Warriors',player:player?'Fixture Player':'Team scoring',title:player?'Fixture Player · Points':'Fixture Warriors · Scores',kind:'Historical API',season:'2025',unit:'points',source:'Test fixture provider',url:'https://example.org/schedule',sources:['https://example.org/schedule','https://example.org/boxscore'],retrievedAt:'2025-06-01T00:00:00Z',scope:'Synthetic fixture used by the browser test.',rows:[12,0,18].map((value,i)=>({label:'Game '+(i+1),date:'2025-05-0'+(i+1),value}))}});
 });
 await page.goto('/');await page.getByRole('button',{name:'Sports Data Explorer',exact:true}).click();await page.getByRole('combobox',{name:'Team',exact:true}).selectOption('9');await page.getByRole('combobox',{name:'Player',exact:true}).selectOption('30');await page.getByRole('combobox',{name:'Statistic',exact:true}).selectOption('points');await page.getByRole('button',{name:'Load sports data'}).click();await expect(page.getByRole('heading',{name:'Fixture Player · Points'})).toBeVisible();await expect(page.locator('.summary-panel strong').first()).toHaveText('10');
 await page.getByRole('button',{name:'Use this dataset in a lesson'}).click();await page.getByRole('button',{name:'Worked example',exact:true}).click();await expect(page.getByText('Test fixture provider',{exact:true})).toBeVisible();await expect(page.locator('.result-box strong')).toHaveText('7.483');
 await page.reload();await page.getByRole('button',{name:'Sports Data Explorer',exact:true}).click();await expect(page.getByRole('heading',{name:'Fixture Player · Points'})).toBeVisible();expect(requests.filter(q=>q.includes('action=dataset')).length).toBeGreaterThanOrEqual(2);
});

test('Gemini research shows citations and rendered mathematics, while course research needs student confirmation',async({page})=>{
 await status(page);await page.route('**/api/ai/research',r=>r.fulfill({json:{ai:true,mode:'Gemini web research · review cited sources',text:'A sourced explanation: $s^2 = 4$. This is not a verified course requirement.',sources:[{url:'https://www.nist.gov',title:'Original statistics reference'}]}}));
 await page.goto('/');await page.getByRole('button',{name:'AI Statistics Tutor',exact:true}).click();await page.getByRole('checkbox',{name:/Use AI for this conversation/}).check();await page.getByRole('checkbox',{name:/Find sourced information with web research/}).check();await page.getByRole('textbox',{name:'Message your stats tutor'}).fill('Find a public reference for variance');await page.getByRole('button',{name:'Send message',exact:true}).click();await expect(page.getByRole('link',{name:/Original statistics reference/})).toHaveAttribute('href','https://www.nist.gov');await expect(page.locator('.katex').first()).toBeVisible();
 await page.getByRole('button',{name:'My Statistics Course',exact:true}).click();await page.getByPlaceholder('e.g. University of Michigan').fill('Fictional university');await page.getByPlaceholder('e.g. STATS 250').fill('STATS 101');await page.getByRole('button',{name:'Research this course with Gemini'}).click();await expect(page.getByRole('link',{name:/Original statistics reference/})).toBeVisible();await expect(page.getByRole('checkbox',{name:/^Mean, median & mode/})).not.toBeChecked();
});

test('PDF syllabus text is extracted locally and can identify topics without AI',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Build my learning roadmap'}).click();await page.locator('input[type=file]').setInputFiles(path.resolve('tests/fixtures/syllabus.pdf'));await expect(page.getByPlaceholder('Paste your topic list')).toHaveValue(/Fictional syllabus: mean and median/);await page.getByRole('button',{name:'Find topics',exact:true}).click();await expect(page.getByRole('checkbox',{name:/^Mean, median & mode/})).toBeChecked();await expect(page.getByRole('checkbox',{name:/^Variance & standard deviation/})).toBeChecked();
});
