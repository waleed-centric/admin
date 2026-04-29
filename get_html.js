require('dotenv').config({path: '.env.local'});
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const doc = await mongoose.connection.collection('packages').findOne({detailed_html: {$exists: true}});
  const fs = require('fs');
  fs.writeFileSync('temp_html.html', doc ? (doc.detailed_html || '') : '');
  process.exit(0);
});