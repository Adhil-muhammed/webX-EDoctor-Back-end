import type { ProviderServiceModel } from './provider-service.model';

export class ProviderServiceRepository {
  async findById(id: string): Promise<ProviderServiceModel | null> {
    void id;
    return null;
  }
}
