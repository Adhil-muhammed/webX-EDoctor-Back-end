import type { ApiGatewayModel } from './api-gateway.model';

export class ApiGatewayRepository {
  async findById(id: string): Promise<ApiGatewayModel | null> {
    void id;
    return null;
  }
}
