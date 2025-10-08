import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { DashboardResolver } from './resolvers/dashboard.resolver';
import { ActivityTypeResolver } from './resolvers/activity-type.resolver';
import { DashboardsModule } from '../dashboards/dashboards.module';

/**
 * GitHub Dashboard GraphQL Module
 * Single Responsibility: Configure and provide GraphQL functionality for GitHub Dashboard
 */
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true, // Generates schema automatically from decorators
      playground: true, // Enable GraphQL playground for development
      introspection: true, // Allow introspection queries
      context: ({ req }) => ({ req }), // Pass request context to resolvers
      formatError: (error) => {
        // Format GraphQL errors consistently
        return {
          message: error.message,
          code: error.extensions?.code || 'INTERNAL_ERROR',
          path: error.path,
        };
      },
    }),
    DashboardsModule, // Import the module that provides the services
  ],
  providers: [
    DashboardResolver,
    ActivityTypeResolver,
  ],
})
export class GitHubDashboardGraphQLModule {}
