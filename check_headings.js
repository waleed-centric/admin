const mongoose = require('mongoose');
require('dotenv').config({path: '.env.local'});
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const doc = await mongoose.connection.collection('packages').findOne({detailed_html: {$exists: true}});
  
  const html = doc.detailed_html;
  const headings = html.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi) || [];
  console.log("=== Headings ===");
  headings.forEach(h => console.log(h.replace(/<[^>]+>/g, '').trim()));
  
  const listItems = html.match(/<li[^>]*>(.*?)<\/li>/gi) || [];
  console.log("\n=== List Items ===");
  listItems.forEach(l => console.log(l.replace(/<[^>]+>/g, '').trim()));

  process.exit(0);
});