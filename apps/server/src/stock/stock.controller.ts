import { Controller, Get, Put, Param, Delete } from '@nestjs/common';
import { StockService } from './stock.service';

@Controller('stock')
export class StockController {
    constructor(private readonly stockService: StockService) { }

    @Get(':symbol')
    async getStock(@Param('symbol') symbol: string) {
        return this.stockService.getStockData(symbol.toUpperCase());
    }

    @Put(':symbol')
    async startTracking(@Param('symbol') symbol: string) {
        return this.stockService.startTracking(symbol.toUpperCase());
    }

    @Delete(':symbol')
    async stopTracking(@Param('symbol') symbol: string) {
        return this.stockService.stopTracking(symbol.toUpperCase());
    }
}