// set PUPPETEER_SKIP_DOWNLOAD='true'
// set PUPPETEER_EXECUTABLE_PATH='C:\Program Files (x86)\Google\Chrome\Application\chrome.exe'
import puppeteer, { TimeoutError } from 'puppeteer';

// change this
const albumUrl = 'https://postimg.cc/gallery/XXXXX';

// Launch the browser and open a new blank page
const browser = await puppeteer.launch({headless: false});
const page = await browser.newPage();

// block unwanted tracking and stops infinite loading
page.setRequestInterception(true);

page.on('request', (request) => {
    if (blockRequest(request.url())) {
        const u = request.url();
        console.log(`request to ${u.substring(0, 50)}...${u.substring(u.length - 5)} is aborted`);

        request.abort();

        return;
    }

    request.continue();
});

// Navigate the page to a URL.
await page.goto(albumUrl);

// Set screen size.
await page.setViewport({width: 1080, height: 1024});

// scrolls page and load all images
await autoScroll(page);

// find all links to the image
const links = await page.$$('.thumb a');
console.log(`Images count: ${links.length}`);

for(var i=0; i<links.length; i++) {
    let linkEl = links[i];
    let linkUrl = await page.evaluate(el => el.getAttribute("href"), linkEl);

    if (linkUrl.startsWith('//')) {
        linkUrl = `https://${linkUrl}`;
    }

    // load each image
    const page2 = await browser.newPage();

    const home = process.platform === 'win32'
        ? process.env.HOME + '\\Downloads'
        : process.env.HOME + '/Downloads';

    const client = await page2.createCDPSession();
    await client.send('Browser.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: home,
        eventsEnabled: true,
    });

    const downloadPromise = new Promise((resolve) => {
        client.on('Browser.downloadProgress', event => {
            if (event.state === 'completed') {
                resolve(event.guid);
            }
        });
    });

    page2.setRequestInterception(true);
    page2.on('request', (request) => {
        if (blockRequest(request.url())) {
            const u = request.url();
            console.log(`request to ${u.substring(0, 50)}...${u.substring(u.length - 5)} is aborted`);
    
            request.abort();
    
            return;
        }
    
        request.continue();
    });

    await page2.goto(linkUrl);

    // find download button and click
    const button = await page2.locator('#download');
    await button.click();

    await timeout(500);

    await downloadPromise;
    await page2.close();
}

await browser.close();

function timeout(ms) {
    return new Promise(resolve => {
        setTimeout(() => resolve(), ms);
    })
}

function blockRequest(url) {
    return url.indexOf('doubleclick.net') > -1 
        || url.indexOf('cm.mgid.com') > -1 
}

async function autoScroll(page, maxScrolls){
    await page.evaluate(async (maxScrolls) => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var scrolls = 0;  // scrolls counter
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                scrolls++;  // increment counter
                // stop scrolling if reached the end or the maximum number of scrolls
                if(totalHeight >= scrollHeight - window.innerHeight || scrolls >= maxScrolls){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    }, maxScrolls);  // pass maxScrolls to the function
}
