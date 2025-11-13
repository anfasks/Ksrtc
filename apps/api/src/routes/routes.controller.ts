import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { CreateStopDto } from './dto/create-stop.dto';
import { CreateRouteDto } from './dto/create-route.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post('stops')
  createStop(@Body() dto: CreateStopDto) {
    return this.routesService.createStop(dto);
  }

  @Get('stops')
  listStops() {
    return this.routesService.findStops();
  }

  @Post('routes')
  createRoute(@Body() dto: CreateRouteDto) {
    return this.routesService.createRoute(dto);
  }

  @Get('routes')
  listRoutes() {
    return this.routesService.listRoutes();
  }
}
