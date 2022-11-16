import mongoClient from './mongodbMgr';

async function searchByLocation(latitude: number, longitude: number, radius: number) {
    return await mongoClient.exec(async (mdb: any) => {
        const userCol = mdb.collection('restaurant');
        let findResult = await userCol.find({
            location: {
                $near: {
                    $geometry: {type: "Point", coordinates: [longitude, latitude]},
                    $minDistance: 0,
                    $maxDistance: radius
                }
            }
        }).toArray();
        for (const data of findResult) {
            data.location = {
                lat: data.location.coordinates[1],
                lng: data.location.coordinates[0]
            }
        }
        return findResult;
    });
}

async function searchByName(name: string) {
    return await mongoClient.exec(async (mdb: any) => {
        const userCol = mdb.collection('restaurant');
        let findResult = await userCol.find({
            name: { $regex: new RegExp(name)}
        }).toArray();
        for (const data of findResult) {
            data.location = {
                lat: data.location.coordinates[1],
                lng: data.location.coordinates[0]
            }
        }
        return findResult;
    });
}

export default {
    searchByLocation,
    searchByName
};
