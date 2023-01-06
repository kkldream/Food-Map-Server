import axios from "axios";
import dotenv from 'dotenv';

dotenv.config();

export interface fcmSendRequest {
    title?: string;
    body?: string;
    data?: any;
    priority?: boolean;
    click_action?: string;
}

export interface fcmSendResponse {
    multicast_id: number;
    success: number;
    failure: number;
    canonical_ids: number;
    results: { message_id: string; }[]
}

/**
 * 向多個FCM Token發送訊息
 * 官方文件：https://firebase.google.com/docs/cloud-messaging/http-server-ref
 * @param fcmTokenList
 * @param content
 */
export async function fcmSendMessage(fcmTokenList: string[], content: fcmSendRequest): Promise<fcmSendResponse> {
    let axiosConfig = {
        method: 'post',
        url: 'https://fcm.googleapis.com/fcm/send',
        headers: {
            'Authorization': `key=${process.env.FCM_ACCESS_KEY}`,
            'Content-Type': 'application/json'
        },
        data: {
            "registration_ids": fcmTokenList,
            "priority": content.priority ? "high" : "normal",
            "notification": {
                "title": content.title,
                "body": content.body
            },
            "data": content.data
        }
    };
    return (await axios(axiosConfig)).data;
}
