import { Logger } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import databaseConfig from '../config/database.config';
import * as schema from '../database/schema';

export class DatabaseConnection {
	private static instance: DatabaseConnection;
	private client: postgres.Sql;
	private db: ReturnType<typeof drizzle>;
	private logger = new Logger(DatabaseConnection.name);

	constructor() {
		this.initializeConnection();
	}

	public static getInstance(): DatabaseConnection {
		if (!DatabaseConnection.instance) {
			DatabaseConnection.instance = new DatabaseConnection();
		}
		return DatabaseConnection.instance;
	}

	private initializeConnection(): void {
		const config = databaseConfig();
		this.client = postgres(config.url, {
			max: config.maxConnections,
			ssl: config.ssl,
			onnotice: (notice) => this.logger.debug(`PostgreSQL notice: ${notice.message}`),
		});
		this.db = drizzle(this.client, { schema });
		this.logger.log('Database connection initialized');
	}

	public getDb() {
		return this.db;
	}

	public getClient() {
		return this.client;
	}

	public async close(): Promise<void> {
		await this.client.end();
		this.logger.log('Database connection closed');
	}
}

export const db = DatabaseConnection.getInstance().getDb();
export const client = DatabaseConnection.getInstance().getClient();
