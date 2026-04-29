const mongoose = require('mongoose');
require('dotenv').config({path: '.env.local'});
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const docs = await mongoose.connection.collection('packages').find({detailed_html: {$exists: true}}).limit(20).toArray();
  docs.forEach((d, i) => {
    console.log(d.uuid, 
    '| firstCityNumberOfNights:', d.firstCityNumberOfNights, 
    '| lastCityNumberOfNights:', d.lastCityNumberOfNights, 
    '| firstNumberOfNights:', d.firstNumberOfNights, 
    '| lastNumberOfNights:', d.lastNumberOfNights, 
    '| madinahGroundCenterId:', d.madinahGroundCenterId, 
    '| makkahGroundCenterId:', d.makkahGroundCenterId);
  });
  process.exit(0);
});