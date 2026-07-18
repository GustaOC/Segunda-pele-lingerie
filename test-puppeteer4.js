const puppeteer = require('puppeteer');
const http = require('http');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('pageerror', error => {
    console.log('\n--- PAGE ERROR ---');
    console.log(error.stack || error.message);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('\n--- CONSOLE ERROR ---');
      console.log(msg.text());
    }
  });

  await page.goto('http://localhost:3011', { waitUntil: 'networkidle0' });
  
  console.log("Page loaded. Exiting.");
  await browser.close();
})();
