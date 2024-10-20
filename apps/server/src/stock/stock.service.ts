import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StockPriceSchedulerService } from '../stock-price-scheduler/stock-price-scheduler.service';

@Injectable()
export class StockService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly schedulerService: StockPriceSchedulerService,
    ) { }

    async getStockData(symbol: string) {
        const latestPrice = await this.prismaService.stockPrice.findFirst({
            where: { symbol },
            orderBy: { timestamp: 'desc' },
        });

        if (!latestPrice) {
            throw new Error(`No data available for symbol: ${symbol}`);
        }

        const movingAverage = await this.calculateMovingAverage(symbol);

        return {
            symbol,
            currentPrice: latestPrice.price,
            lastUpdated: latestPrice.timestamp,
            movingAverage,
        };
    }

    async calculateMovingAverage(symbol: string): Promise<number> {
        const prices = await this.prismaService.stockPrice.findMany({
            where: { symbol },
            orderBy: { timestamp: 'desc' },
            take: 10,
        });
        if (prices.length === 0) {
            return 0;
        }
        const sum = prices.reduce((accumulator, current) => accumulator + current.price, 0);
        return sum / prices.length;
    }

    async startTracking(symbol: string) {
        this.schedulerService.addSymbol(symbol);
        return { message: `Started tracking ${symbol}` };
    }
}