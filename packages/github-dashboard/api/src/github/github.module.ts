import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GitHubController } from './github.controller';
import { GitHubService } from './github.service';
import { RateLimitService } from './rate-limit.service';
import { GitHubCacheService } from './cache/github-cache.service';

// New services
import { GitHubBaseService } from './services/github-base.service';
import { GitHubUserService } from './services/github-user.service';
import { GitHubRepositoryService } from './services/github-repository.service';
import { GitHubActivityService } from './services/github-activity.service';

// New controllers
import { GitHubUserController } from './controllers/github-user.controller';
import { GitHubRepositoryController } from './controllers/github-repository.controller';
import { GitHubActivityController } from './controllers/github-activity.controller';

@Module({
  imports: [HttpModule],
  controllers: [
    GitHubController, // Keep original for backward compatibility
    GitHubUserController,
    GitHubRepositoryController,
    GitHubActivityController,
  ],
  providers: [
    // Original services (keep for backward compatibility)
    GitHubService,
    RateLimitService,
    GitHubCacheService,
    
    // New services
    GitHubBaseService,
    GitHubUserService,
    GitHubRepositoryService,
    GitHubActivityService,
  ],
  exports: [
    // Original exports (keep for backward compatibility)
    GitHubService,
    RateLimitService,
    GitHubCacheService,
    
    // New exports
    GitHubBaseService,
    GitHubUserService,
    GitHubRepositoryService,
    GitHubActivityService,
  ],
})
export class GitHubModule {}
