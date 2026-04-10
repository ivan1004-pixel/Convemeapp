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
      // Notificaciones desactivadas por solicitud del usuario
      /*
      await axios.post('https://exp.host/--/api/v2/push/send', message, {
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
      });
      */
    } catch (error) {
      // Notification failure is silent
    }
  }
}
