import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { BaseRepository } from '../base.repository';
import { activityType, ActivityType } from '../entities';

@Injectable()
export class ActivityTypeRepository extends BaseRepository<typeof activityType> {
  constructor() {
    super(activityType);
  }

  /**
   * Get all activity types
   */
  async findAll(): Promise<ActivityType[]> {
    return await this.db.select().from(this.table);
  }

  /**
   * Get activity type by name
   */
  async findByName(name: string): Promise<ActivityType | null> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.code, name))
      .limit(1);
    
    return result[0] || null;
  }
}
