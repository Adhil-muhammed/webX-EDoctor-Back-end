import type { SearchServiceModel } from './search-service.model';

export class SearchServiceRepository {
  async findById(id: string): Promise<SearchServiceModel | null> {
    void id;
    return null;
  }
}
