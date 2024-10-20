import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FinnhubService } from '../finnhub/finnhub.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StockPriceSchedulerService {
    private symbolsToTrack: Set<string> = new Set(['AAPL']);

    constructor(
        private readonly finnhubService: FinnhubService,
        private readonly prismaService: PrismaService,
    ) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async fetchStockPrices() {
        for (const symbol of this.symbolsToTrack) {
            try {
                const price = await this.finnhubService.getStockPrice(symbol);
                await this.prismaService.stockPrice.create({
                    data: {
                        symbol,
                        price,
                    },
                });
                console.log(`Fetched and stored price for ${symbol}: $${price}`);
            } catch (error) {
                console.error(`Error fetching price for ${symbol}:`, error.message);
            }
        }
    }

    addSymbol(symbol: string) {
        this.symbolsToTrack.add(symbol.toUpperCase());
    }
}