import { Controller, Get, Put, Delete, Param, HttpException, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { StockService } from './stock.service';
import { SymbolParam } from './symbol-param.dto';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) { }

  @Get(':symbol')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getStock(@Param() params: SymbolParam) {
    try {
      return await this.stockService.getStockData(params.symbol);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':symbol')
  @UsePipes(new ValidationPipe({ transform: true }))
  async startTracking(@Param() params: SymbolParam) {
    return await this.stockService.startTracking(params.symbol);
  }

  @Delete(':symbol')
  @UsePipes(new ValidationPipe({ transform: true }))
  async stopTracking(@Param() params: SymbolParam) {
    return await this.stockService.stopTracking(params.symbol);
  }
}