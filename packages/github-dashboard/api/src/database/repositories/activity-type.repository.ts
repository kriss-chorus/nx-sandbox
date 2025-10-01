import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../base.repository';
import { activityTypes, ActivityType, NewActivityType } from '../entities';
import { eq } from 'drizzle-orm';

@Injectable()
export class ActivityTypeRepository extends BaseRepository<typeof activityTypes> {
  constructor() {
    super(activityTypes);
  }

  /**
   * Get all activity types
   */
  async findAll(): Promise<ActivityType[]> {
    return await this.db.select().from(this.table);
  }

  /**
   * Get activity types by category
   */
  async findByCategory(category: string): Promise<ActivityType[]> {
    return await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.category, category));
  }

  /**
   * Get activity type by name
   */
  async findByName(name: string): Promise<ActivityType | null> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.name, name))
      .limit(1);
    
    return result[0] || null;
  }

  /**
   * Create default activity types if they don't exist
   */
  async createDefaults(): Promise<void> {
    const defaultActivityTypes: NewActivityType[] = [
      {
        name: 'prs_opened',
        displayName: 'PRs Opened',
        description: 'Track when team members create pull requests',
        category: 'pr_management'
      },
      {
        name: 'prs_merged',
        displayName: 'PRs Merged',
        description: 'Track when pull requests are successfully merged',
        category: 'pr_management'
      },
      {
        name: 'pr_reviews',
        displayName: 'PR Reviews',
        description: 'Includes: comments, approvals, change requests, emoji reactions on PRs',
        category: 'pr_review'
      },
      {
        name: 'commits',
        displayName: 'Commits',
        description: 'Track individual commits',
        category: 'general'
      },
      {
        name: 'issues',
        displayName: 'Issues',
        description: 'Track issue creation and management',
        category: 'general'
      }
    ];

    for (const activityType of defaultActivityTypes) {
      const existing = await this.findByName(activityType.name);
      if (!existing) {
        await this.db.insert(this.table).values(activityType);
      }
    }
  }
}
