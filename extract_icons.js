
const fs = require('fs');
const path = require('path');

const index = fs.readFileSync('index.html', 'utf-8');
const regex = /link rel="icon" type="image\/svg\+xml" href="data:image\/svg\+xml,([^"]+)"/;
const match = index.match(regex);

if (match) {
    let svg = match[1];
    svg = svg.replace(/%3C/g, '<')
        .replace(/%3E/g, '>')
        .replace(/%23/g, '#')
        .replace(/%27/g, "'");

    fs.writeFileSync('icon.svg', svg);
    console.log('Created icon.svg');
} else {
    console.log('No SVG icon found');
}
