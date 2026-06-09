import type { AuthServiceModel } from './auth-service.model';

export class AuthServiceRepository {
  async findById(id: string): Promise<AuthServiceModel | null> {
    void id;
    return null;
  }
}
