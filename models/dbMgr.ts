import { MongoClient } from 'mongodb';

const mongodbUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/';
const dbName = 'food_map';

async function exec(colName: string, func: any) {
    const client = await MongoClient.connect(mongodbUrl);
    const col = client.db(dbName).collection(colName);
    const result = await func(col);
    await client.close();
    return result;
};

module.exports = {
    exec
};