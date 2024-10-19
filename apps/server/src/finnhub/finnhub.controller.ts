import { Controller, Get, Param } from '@nestjs/common';
import { FinnhubService } from './finnhub.service';

@Controller('stock')
export class FinnhubController {
    constructor(private readonly finnhubService: FinnhubService) { }

    @Get(':symbol')
    async getStockPrice(@Param('symbol') symbol: string): Promise<number> {
        return this.finnhubService.getStockPrice(symbol);
    }
}