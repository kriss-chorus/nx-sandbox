import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GitHubController } from './github.controller';
import { GitHubService } from './github.service';
import { RateLimitService } from './rate-limit.service';
import { GitHubCacheService } from './cache/github-cache.service';

@Module({
  imports: [HttpModule],
  controllers: [GitHubController],
  providers: [GitHubService, RateLimitService, GitHubCacheService],
  exports: [GitHubService, RateLimitService, GitHubCacheService],
})
export class GitHubModule {}
