import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class NotificationsService {
  async sendPushNotification(expoPushToken: string, title: string, body: string, data: any = {}) {
    if (!expoPushToken || !expoPushToken.startsWith('ExponentPushToken')) return;

    const message = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data,
    };

    try {
      await axios.post('https://exp.host/--/api/v2/push/send', message, {
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }
}
