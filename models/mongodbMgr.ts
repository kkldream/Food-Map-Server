import {MongoClient} from "mongodb";

export default class MongodbClient {
    private client: MongoClient;

    // Collection List
    public foodMapDb: {
        placeCol?: any,
        userCol?: any,
        loginLogCol?: any,
        updateLogCol?: any,
        drawCardLogCol?: any
    } = {};

    initDbColList(client: MongoClient) {
        // Db List
        let foodMapDb = client.db('food_map');
        // Collection List
        this.foodMapDb.placeCol = foodMapDb.collection('googlePlace');
        this.foodMapDb.userCol = foodMapDb.collection('userV2');
        this.foodMapDb.loginLogCol = foodMapDb.collection('userLog');
        this.foodMapDb.updateLogCol = foodMapDb.collection('searchLog');
    }

    constructor(url: string) {
        this.client = new MongoClient(url);
        this.client.connect().then(async client => {
            this.client = client;
            console.log('mongo client is connected');
            this.initDbColList(client);
        })
    }

    db(dbName: string) {
        return this.client.db(dbName);
    }

    // 方法已棄用
    // isConnected() {
    //     return this.client.isConnected();
    // }

    close() {
        this.client.close().then(r => {
            console.log('mongo client is disconnect')
        });
    }
}
