import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SearchServiceHealthController } from './entrypoints/http/search-service.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [SearchServiceHealthController],
})
class SearchServiceModule {}

export function createSearchServiceModule(): typeof SearchServiceModule {
  return SearchServiceModule;
}
