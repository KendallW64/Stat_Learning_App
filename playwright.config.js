import fs from 'node:fs';
import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',use:{baseURL:'http://127.0.0.1:3000',headless:true,launchOptions:{...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:fs.existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{})}},workers:1,webServer:{command:'npm run dev',url:'http://127.0.0.1:3000/api/health',reuseExistingServer:true},reporter:'list'});
