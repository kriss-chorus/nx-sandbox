import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { DashboardsService } from './dashboards.service';
import { CreateDashboardDto, UpdateDashboardDto, AddUserToDashboardDto, RemoveUserFromDashboardDto, UpdateActivityConfigDto } from './dto';

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

  @Get('activity-types')
  @HttpCode(HttpStatus.OK)
  async getAvailableActivityTypes() {
    return this.dashboardsService.getAvailableActivityTypes();
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

  @Post(':id/users')
  @HttpCode(HttpStatus.CREATED)
  async addUser(@Param('id') id: string, @Body() addUserDto: AddUserToDashboardDto) {
    return this.dashboardsService.addUserToDashboard(id, addUserDto);
  }

  @Delete(':id/users/:username')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeUser(@Param('id') id: string, @Param('username') username: string) {
    await this.dashboardsService.removeUserFromDashboard(id, username);
  }

  @Get(':id/users')
  async getUsers(@Param('id') id: string) {
    return this.dashboardsService.getDashboardUsers(id);
  }

  // Repository Management Endpoints
  @Post(':id/repositories')
  @HttpCode(HttpStatus.CREATED)
  async addRepositoryToDashboard(
    @Param('id') id: string,
    @Body() body: { name: string }
  ) {
    await this.dashboardsService.addRepositoryToDashboard(id, body.name);
    return { message: 'Repository added to dashboard successfully' };
  }

  @Delete(':id/repositories/:name')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeRepositoryFromDashboard(
    @Param('id') id: string,
    @Param('name') name: string
  ) {
    await this.dashboardsService.removeRepositoryFromDashboard(id, name);
  }

  @Get(':id/repositories')
  @HttpCode(HttpStatus.OK)
  async getDashboardRepositories(@Param('id') id: string) {
    return this.dashboardsService.getDashboardRepositories(id);
  }

  // Activity Configuration Endpoints
  @Get(':id/activity-config')
  @HttpCode(HttpStatus.OK)
  async getActivityConfiguration(@Param('id') id: string) {
    return this.dashboardsService.getActivityConfiguration(id);
  }

  @Put(':id/activity-config')
  @HttpCode(HttpStatus.OK)
  async updateActivityConfiguration(
    @Param('id') id: string,
    @Body() updateDto: UpdateActivityConfigDto
  ) {
    return this.dashboardsService.updateActivityConfiguration(id, updateDto);
  }
}
