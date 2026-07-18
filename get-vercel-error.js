const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
    console.log('STACK:', error.stack);
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });

  try {
    await page.goto('https://segunda-pele-lingerie-six.vercel.app', { waitUntil: 'networkidle0', timeout: 15000 });
    console.log("Page loaded successfully.");
  } catch (err) {
    console.log("Navigation error:", err.message);
  }

  await browser.close();
})();
