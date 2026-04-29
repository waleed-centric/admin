const mongoose = require('mongoose');
require('dotenv').config({path: '.env.local'});
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const docs = await mongoose.connection.collection('packages').find({detailed_html: {$exists: true}}).limit(20).toArray();
  docs.forEach((d, i) => {
    console.log(`\n--- Package ${i} | ${d.uuid} ---`);
    
    // Look for "Beginning in Makkah/Madinah" or "Starting in"
    const beginMatch = d.detailed_html.match(/(?:Beginning in|Start in|Starting in|First in|Journey begins in) (Makkah|Madinah)/i);
    if (beginMatch) console.log('Found start text:', beginMatch[0]);

    // Check the summary block for hotels order
    const makkahIndex = d.detailed_html.indexOf('Hotel in Makkah');
    const madinahIndex = d.detailed_html.indexOf('Hotel in Madinah');
    if (makkahIndex !== -1 && madinahIndex !== -1) {
        console.log(`Hotel in Makkah index: ${makkahIndex}, Hotel in Madinah index: ${madinahIndex}`);
        console.log(`Order based on Hotel sections: ${makkahIndex < madinahIndex ? 'Makkah First' : 'Madinah First'}`);
    } else {
        console.log('Hotel indexes not both found');
    }

    // Try to find the timeline elements
    // usually in Nusuk HTML, timeline is represented by elements with classes like "timeline-item" or similar.
    // Let's just find "Makkah" and "Madinah" indices overall
    const firstMakkah = d.detailed_html.indexOf('Makkah');
    const firstMadinah = d.detailed_html.indexOf('Madinah');
    console.log(`First mention Makkah: ${firstMakkah}, Madinah: ${firstMadinah}`);
    
  });
  process.exit(0);
});
