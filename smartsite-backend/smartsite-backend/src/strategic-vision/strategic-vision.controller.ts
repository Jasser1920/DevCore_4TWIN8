import { Controller, Post, Get, Put, Param, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StrategicVisionService } from './strategic-vision.service';
import { CreateStrategicVisionDto, UpdateStrategicVisionDto, ValidateStrategicVisionDto } from './strategic-vision.dto';

@Controller('strategic-vision')
@UseGuards(AuthGuard('jwt'))
export class StrategicVisionController {
  constructor(private readonly strategicVisionService: StrategicVisionService) {}

  @Post(':companyId')
  async createStrategicVision(
    @Param('companyId') companyId: string,
    @Body() dto: CreateStrategicVisionDto,
    @Request() req,
  ) {
    const ipAddress = req.ip || 'UNKNOWN';
    const userAgent = req.get('user-agent') || 'UNKNOWN';

    const vision = await this.strategicVisionService.createStrategicVision(
      companyId,
      dto,
      req.user,
      ipAddress,
      userAgent,
    );

    return {
      message: 'Strategic vision created successfully',
      data: vision,
    };
  }

  @Get(':companyId')
  async getStrategicVision(@Param('companyId') companyId: string) {
    const vision = await this.strategicVisionService.getStrategicVision(companyId);

    return {
      message: 'Strategic vision retrieved successfully',
      data: vision,
    };
  }

  @Put(':visionId')
  async updateStrategicVision(
    @Param('visionId') visionId: string,
    @Body() dto: UpdateStrategicVisionDto,
    @Request() req,
  ) {
    const ipAddress = req.ip || 'UNKNOWN';
    const userAgent = req.get('user-agent') || 'UNKNOWN';

    const vision = await this.strategicVisionService.updateStrategicVision(
      visionId,
      dto,
      req.user,
      ipAddress,
      userAgent,
    );

    return {
      message: 'Strategic vision updated successfully',
      data: vision,
    };
  }

  @Post(':visionId/validate')
  async validateStrategicVision(
    @Param('visionId') visionId: string,
    @Body() dto: ValidateStrategicVisionDto,
    @Request() req,
  ) {
    const ipAddress = req.ip || 'UNKNOWN';
    const userAgent = req.get('user-agent') || 'UNKNOWN';

    if (!['APPROVED', 'REJECTED'].includes(dto.status)) {
      throw new BadRequestException('Status must be APPROVED or REJECTED');
    }

    const vision = await this.strategicVisionService.validateStrategicVision(
      visionId,
      dto,
      req.user,
      ipAddress,
      userAgent,
    );

    return {
      message: `Strategic vision ${dto.status.toLowerCase()} successfully`,
      data: vision,
    };
  }
}
