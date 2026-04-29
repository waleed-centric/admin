const mongoose = require('mongoose');
require('dotenv').config({path: '.env.local'});
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const docs = await mongoose.connection.collection('packages').find({}).limit(10).toArray();
  
  docs.forEach((d) => {
      console.log(`\n--- Package: ${d.uuid} ---`);
      if (d.hotels && d.hotels.length > 0) {
          d.hotels.forEach(h => console.log(h.name || h.city || h.type));
      } else {
          console.log('No hotels array');
      }
  });

  process.exit(0);
});