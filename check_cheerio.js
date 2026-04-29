const mongoose = require('mongoose');
require('dotenv').config({path: '.env.local'});
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const doc = await mongoose.connection.collection('packages').findOne({detailed_html: {$exists: true}});
  
  const html = doc.detailed_html;
  // Let's print out all headings and list items to see if there's a schedule
  const cheerio = require('cheerio');
  const $ = cheerio.load(html);
  
  console.log("=== Headings ===");
  $('h1, h2, h3, h4, h5, h6').each((i, el) => {
      console.log($(el).text().trim().substring(0, 100));
  });

  console.log("\n=== Itinerary / Timeline / Schedule ===");
  // Look for elements with these classes
  $('[class*="timeline"], [class*="schedule"], [class*="itinerary"], [class*="step"]').each((i, el) => {
      console.log($(el).text().trim().replace(/\s+/g, ' ').substring(0, 200));
  });
  
  process.exit(0);
});