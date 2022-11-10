const mdb = require('./dbMgr');

async function searchByLocation(latitude: Number, longitude: Number, radius: Number) {
    return await mdb.exec('restaurant', async (col: any) => {
        let findResult = await col.find({
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
    return await mdb.exec('restaurant', async (col: any) => {
        let findResult = await col.find({
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

module.exports = {
    searchByLocation,
    searchByName
};
