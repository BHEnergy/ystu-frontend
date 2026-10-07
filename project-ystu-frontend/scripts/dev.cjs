const fs = require('node:fs');
const path = require('node:path');
const build = require('./build.cjs');
build();
require('./serve.cjs');
let timer;
fs.watch(path.resolve(__dirname, '../src'), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
        try { build(); } catch (error) { console.error(error.message); }
    }, 200);
});
