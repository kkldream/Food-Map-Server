import {MongoClient} from "mongodb";

export default class MongodbClient {
    private client: MongoClient;

    // Collection List
    public foodMapDb: {
        placeCol?: any,
        userCol?: any,
        userLogCol?: any,
        photoCol?: any,
        googleApiLogCol?: any,
        routeApiLogCol?: any,
    } = {};

    initDbColList(client: MongoClient) {
        // Db List
        let foodMapDb = client.db('food_map');
        // Collection List
        this.foodMapDb.placeCol = foodMapDb.collection('place');
        this.foodMapDb.userCol = foodMapDb.collection('user');
        this.foodMapDb.userLogCol = foodMapDb.collection('userLog');
        this.foodMapDb.photoCol = foodMapDb.collection('photo');
        this.foodMapDb.googleApiLogCol = foodMapDb.collection('googleApiLog');
        this.foodMapDb.routeApiLogCol = foodMapDb.collection('routeApiLog');
    }

    constructor(url: string, callback: (() => void)) {
        this.client = new MongoClient(url);
        this.client.connect().then(async client => {
            this.client = client;
            this.initDbColList(client);
            callback();
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
