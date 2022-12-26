import axios from "axios";

const apiUrlBase = "http://kkhomeserver.ddns.net:33000/api"

async function httpPost(path, body) {
    let config = {
        method: 'post',
        url: apiUrlBase + '/user/login',
        headers: {
            'Content-Type': 'application/json'
        },
        data: body
    };
    let response = await axios(config);
    return response.data;
}

export async function callLoginApi(username, password, deviceId) {
    return await httpPost("/user/login", {
        username, password, deviceId
    });
}
