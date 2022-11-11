import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const mongodbUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/';
const dbName = 'food_map';

async function exec(func: any) {
    console.log(mongodbUrl)
    const client = await MongoClient.connect(mongodbUrl);
    const mdb = client.db(dbName);
    const result = await func(mdb);
    await client.close();
    return result;
}

export default { exec }
