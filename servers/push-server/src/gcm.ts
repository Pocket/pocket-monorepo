import { initializeApp } from "firebase-admin/app";
import { Message, getMessaging } from "firebase-admin/messaging";
import admin from 'firebase-admin';
import { serviceAccount } from "./config";



let app = initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
let messaging =  getMessaging(app);

export interface Payload {
	share_id: string,
	item_id: string,
}

export const sendNotificationToDevice = (notification:any, payload:Payload, token:any) : Promise<string> => {
	var message: Message = {
		token: token,
		data: {
			share_id: payload.share_id,
			item_id: payload.item_id,
		}
	};
	return messaging.send(message);
};
