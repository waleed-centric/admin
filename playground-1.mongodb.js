/* eslint-disable */
/* global use, db */
// MongoDB Playground
// To disable this template go to Settings | MongoDB | Use Default Template For Playground.
// Make sure you are connected to enable completions and to be able to run a playground.
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.
// The result of the last command run in a playground is shown on the results panel.
// By default the first 20 documents will be returned with a cursor.
// Use 'console.log()' to print to the debug output.
// For more documentation on playgrounds please refer to
// https://www.mongodb.com/docs/mongodb-vscode/playgrounds/

// Select the database to use.
use('hajj');

// Insert a few documents into the packages collection.
db.getCollection('packages').insertMany([
  {
    uuid: 'pkg-001',
    name: 'Economy Hajj Package',
    price: 5000,
    durationDays: 14,
    hotel: 'Makkah Hotel 3 Star',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    uuid: 'pkg-002',
    name: 'Premium Hajj Package',
    price: 8500,
    durationDays: 21,
    hotel: 'Makkah Hotel 5 Star',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Run a find command to view items
db.getCollection('packages').find({});
