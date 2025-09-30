import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DashboardRepository } from '../database/repositories/dashboard.repository';
import { CreateDashboardDto, UpdateDashboardDto } from './dto';
import { Dashboard } from '../database/entities';

@Injectable()
export class DashboardsService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async create(createDashboardDto: CreateDashboardDto): Promise<Dashboard> {
    const { name, description, isPublic } = createDashboardDto;
    const slug = this.generateSlug(name);

    // Check if slug already exists
    const existing = await this.dashboardRepository.findBySlug(slug);
    if (existing) {
      throw new ConflictException(`Dashboard with slug '${slug}' already exists`);
    }

    return this.dashboardRepository.create({
      name,
      slug,
      description,
      isPublic: isPublic ?? true,
    });
  }

  async findAllPublic(): Promise<Dashboard[]> {
    return this.dashboardRepository.findPublicDashboards();
  }

  async findBySlug(slug: string): Promise<Dashboard> {
    const dashboard = await this.dashboardRepository.findBySlug(slug);
    if (!dashboard) {
      throw new NotFoundException(`Dashboard with slug '${slug}' not found`);
    }
    return dashboard;
  }

  async update(id: string, updateDashboardDto: UpdateDashboardDto): Promise<Dashboard> {
    const existing = await this.dashboardRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Dashboard with id '${id}' not found`);
    }

    const updateData: Partial<UpdateDashboardDto> = { ...updateDashboardDto };
    
    // If name is being updated, generate new slug
    if (updateDashboardDto.name && updateDashboardDto.name !== existing.name) {
      const newSlug = this.generateSlug(updateDashboardDto.name);
      updateData.slug = newSlug;
    }

    const updated = await this.dashboardRepository.updateById(id, updateData);
    if (!updated) {
      throw new NotFoundException(`Dashboard with id '${id}' not found`);
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const existing = await this.dashboardRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Dashboard with id '${id}' not found`);
    }

    const deleted = await this.dashboardRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundException(`Dashboard with id '${id}' not found`);
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  }
}
