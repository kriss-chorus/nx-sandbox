import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from '../config/database.config';

// Feature modules
import { DashboardsModule } from '../dashboards/dashboards.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [databaseConfig] }),
    // DatabaseModule (global) will be added when defined
    DashboardsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
