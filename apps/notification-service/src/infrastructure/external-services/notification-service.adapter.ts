export class NotificationServiceExternalServiceAdapter {
  async ping(): Promise<boolean> {
    return true;
  }
}
