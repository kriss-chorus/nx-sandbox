import { Injectable, Logger } from '@nestjs/common';
import { eq, and, desc, asc } from 'drizzle-orm';
import { DatabaseConnection } from './connection';

@Injectable()
export abstract class BaseRepository<TRecord, TCreate, TUpdate> {
	protected readonly logger = new Logger(this.constructor.name);
	protected readonly db = DatabaseConnection.getInstance().getDb();

	constructor(protected readonly table: any) {}

	async create(data: TCreate): Promise<TRecord> {
		const [result] = await this.db.insert(this.table).values(data).returning();
		return result;
	}

	async findById(id: string): Promise<TRecord | null> {
		const [result] = await this.db.select().from(this.table).where(eq(this.table.id, id)).limit(1);
		return result || null;
	}

	async findAll(filters?: Partial<TRecord>, orderBy?: { field: any; direction: 'asc' | 'desc' }): Promise<TRecord[]> {
		let query = this.db.select().from(this.table);
		if (filters) {
			const conditions = Object.entries(filters)
				.filter(([_, value]) => value !== undefined)
				.map(([key, value]) => eq(this.table[key], value));
			if (conditions.length > 0) query = query.where(and(...conditions));
		}
		if (orderBy) {
			const orderFn = orderBy.direction === 'desc' ? desc : asc;
			query = query.orderBy(orderFn(orderBy.field));
		}
		return await query;
	}

	async updateById(id: string, data: TUpdate & { updatedAt?: Date }): Promise<TRecord | null> {
		const [result] = await this.db
			.update(this.table)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(this.table.id, id))
			.returning();
		return result || null;
	}

	async deleteById(id: string): Promise<boolean> {
		const result = await this.db.delete(this.table).where(eq(this.table.id, id));
		return (result as unknown as { rowCount?: number }).rowCount ? (result as any).rowCount > 0 : true;
	}
}
