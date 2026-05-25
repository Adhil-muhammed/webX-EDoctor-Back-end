export class AuthServiceExternalServiceAdapter {
  async ping(): Promise<boolean> {
    return true;
  }
}
