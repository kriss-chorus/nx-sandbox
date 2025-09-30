import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { DashboardsService } from './dashboards.service';
import { CreateDashboardDto, UpdateDashboardDto } from './dto';

@Controller('dashboards')
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDashboardDto: CreateDashboardDto) {
    return this.dashboardsService.create(createDashboardDto);
  }

  @Get()
  async findAll() {
    return this.dashboardsService.findAllPublic();
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    return this.dashboardsService.findBySlug(slug);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDashboardDto: UpdateDashboardDto) {
    return this.dashboardsService.update(id, updateDashboardDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.dashboardsService.remove(id);
  }
}
