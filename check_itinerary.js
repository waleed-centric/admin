const mongoose = require('mongoose');
require('dotenv').config({path: '.env.local'});
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const docs = await mongoose.connection.collection('packages').find({detailed_html: {$exists: true}}).toArray();
  
  let makkahFirstCount = 0;
  let madinahFirstCount = 0;
  let unknownCount = 0;

  docs.forEach((d) => {
    const text = d.detailed_html.toLowerCase();
    
    // Patterns
    const beginsMadinah = text.includes('journey begins in madinah') || text.includes('beginning in madinah') || text.includes('start in madinah');
    const beginsMakkah = text.includes('journey begins in makkah') || text.includes('beginning in makkah') || text.includes('start in makkah');
    
    if (beginsMadinah && !beginsMakkah) {
        madinahFirstCount++;
    } else if (beginsMakkah && !beginsMadinah) {
        makkahFirstCount++;
    } else {
        // Try looking at "Arrival at" or "Flight to"
        const arrMadinah = text.indexOf('arrival in madinah') !== -1 || text.indexOf('flight to madinah') !== -1;
        const arrMakkah = text.indexOf('arrival in makkah') !== -1 || text.indexOf('flight to jeddah') !== -1;
        
        if (arrMadinah && !arrMakkah) madinahFirstCount++;
        else if (arrMakkah && !arrMadinah) makkahFirstCount++;
        else unknownCount++;
    }
  });

  console.log(`Total packages: ${docs.length}`);
  console.log(`Makkah First: ${makkahFirstCount}`);
  console.log(`Madinah First: ${madinahFirstCount}`);
  console.log(`Unknown: ${unknownCount}`);
  
  process.exit(0);
});