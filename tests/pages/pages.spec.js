import {test,expect} from '@playwright/test';

test('Pages subdirectory serves real assets and completes student journey without API requests',async({page})=>{
 const apiRequests=[],errors=[],failed=[];
 page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/api'))apiRequests.push(r.url());});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)failed.push(`${r.status()} ${r.url()}`);});
 await page.goto('./');await expect(page.getByText('GitHub Pages edition', {exact:false})).toBeVisible();
 await page.getByRole('button',{name:'Build my learning roadmap'}).click();
 await page.getByPlaceholder('e.g. STATS 250').fill('STAT 101');
 await page.getByRole('button',{name:'Find topics',exact:true}).click();await expect(page.getByRole('status')).toContainText('cannot verify');
 await page.getByRole('checkbox',{name:/^Mean, median & mode/}).check();
 await page.getByRole('checkbox',{name:/^Variance & standard deviation/}).check();
 await page.getByRole('button',{name:'Save my learning roadmap'}).click();
 await page.getByRole('button',{name:'Start lesson',exact:true}).click();
 await page.getByRole('button',{name:'Worked example',exact:true}).click();
 await expect(page.getByText('Historical data · 2014–15')).toBeVisible();
 await page.getByRole('button',{name:'Practice',exact:true}).click();
 await page.getByRole('spinbutton',{name:'Your answer'}).fill('10');await page.getByRole('button',{name:'Check my answer'}).click();await expect(page.getByRole('status')).toContainText('Keep going');
 await page.getByRole('spinbutton',{name:'Your answer'}).fill('12');await page.getByRole('button',{name:'Check my answer'}).click();await expect(page.getByRole('status')).toContainText('Progress saved');
 await page.reload();await page.getByRole('button',{name:'Progress & Practice',exact:true}).click();await expect(page.getByText('1/2 correct answers')).toBeVisible();
 await page.getByRole('button',{name:'AI Statistics Tutor',exact:true}).click();await page.getByRole('button',{name:'Give me a hint',exact:true}).click();await expect(page.getByText('Offline teaching guide · no AI model connected')).toBeVisible();
 expect(apiRequests).toEqual([]);expect(errors).toEqual([]);expect(failed).toEqual([]);
});

test('Pages edition handles provider outage and mobile navigation',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.route('https://statsapi.mlb.com/**',r=>r.abort());
 await page.goto('./');await page.getByRole('button',{name:'Open navigation'}).click();await page.getByRole('button',{name:'Sports Data Explorer',exact:true}).click();
 await page.getByRole('button',{name:'Fetch Yankees · June 2024'}).click();await expect(page.getByText(/MLB data is unavailable/)).toBeVisible();await expect(page.getByText('Synthetic teaching dataset', {exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
