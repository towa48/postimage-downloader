# Install before
NodeJS LTS [https://nodejs.org/](https://nodejs.org/)

# How to run script
1. download repo
2. modify album url in index.js file
3. set environment variables to skip chrome download
```bash
set PUPPETEER_SKIP_DOWNLOAD='true'
set PUPPETEER_EXECUTABLE_PATH='C:\Program Files (x86)\Google\Chrome\Application\chrome.exe'
```
4. open terminal, change directory to repo and execute `npm i`
5. execute `node index.js`
6. check downloads folder
