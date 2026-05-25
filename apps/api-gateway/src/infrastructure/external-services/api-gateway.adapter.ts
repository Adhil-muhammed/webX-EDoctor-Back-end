export class ApiGatewayExternalServiceAdapter {
  async ping(): Promise<boolean> {
    return true;
  }
}
