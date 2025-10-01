import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from '../config/database.config';
import githubConfig from '../config/github.config';

// Database module
import { DatabaseModule } from '../database/database.module';

// Feature modules
import { DashboardsModule } from '../dashboards/dashboards.module';
import { GitHubModule } from '../github/github.module';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true, 
      load: [databaseConfig, githubConfig],
      envFilePath: ['.env', '../.env', '../../.env', '../../../.env'] // Look for .env in multiple locations including root
    }),
    DatabaseModule, // Global database module
    DashboardsModule,
    GitHubModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
