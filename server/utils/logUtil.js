
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');

const LOG_FILE = path.join(__dirname, '../logs/app.csv');
const FIELDS = ['timestamp', 'level', 'message', 'source'];

const appendToCsv = (data) => {
    const parser = new Parser({ fields: FIELDS, header: !fs.existsSync(LOG_FILE) });
    const csv = parser.parse(data) + '\n';

    fs.appendFile(LOG_FILE, csv, (err) => {
        if (err) {
            console.error('Failed to write to log file:', err);
        }
    });
};

const log = (level, message, source = 'backend') => {
    const timestamp = new Date().toISOString();
    const data = [{ timestamp, level, message, source }];
    appendToCsv(data);
};

module.exports = { log }; 