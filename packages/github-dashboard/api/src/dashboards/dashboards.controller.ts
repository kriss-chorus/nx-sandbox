import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { DashboardsService } from './dashboards.service';
import { CreateDashboardDto, UpdateDashboardDto, AddUserToDashboardDto, RemoveUserFromDashboardDto } from './dto';

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
}
