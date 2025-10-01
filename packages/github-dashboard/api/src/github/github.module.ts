import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GitHubController } from './github.controller';
import { GitHubService } from './github.service';
import { RateLimitService } from './rate-limit.service';

@Module({
  imports: [HttpModule],
  controllers: [GitHubController],
  providers: [GitHubService, RateLimitService],
  exports: [GitHubService, RateLimitService],
})
export class GitHubModule {}
