import { MongoClient } from 'mongodb';

const mongodbUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/';
const dbName = 'food_map';

async function exec(func: any) {
    const client = await MongoClient.connect(mongodbUrl);
    const mdb = client.db(dbName);
    const result = await func(mdb);
    await client.close();
    return result;
};

module.exports = {
    exec
};