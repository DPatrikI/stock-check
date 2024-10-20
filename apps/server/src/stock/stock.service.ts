import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinnhubService } from '../finnhub/finnhub.service';
import { StockPriceSchedulerService } from '../stock-price-scheduler/stock-price-scheduler.service';
import { InvalidStockSymbolException } from '../exceptions/invalid-stock-symbol.exception';
import { RateLimitExceededException } from '../exceptions/rate-limit-exceeded.exception';

@Injectable()
export class StockService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly schedulerService: StockPriceSchedulerService,
        private readonly finnhubService: FinnhubService,
    ) { }

    async getStockData(symbol: string) {
        let latestPrice = await this.prismaService.stockPrice.findFirst({
            where: { symbol },
            orderBy: { timestamp: 'desc' },
        });

        if (!latestPrice) {
            try {
                const price = await this.finnhubService.getStockPrice(symbol);

                if (!price) {
                    throw new InvalidStockSymbolException(symbol);
                }

                return {
                    symbol,
                    currentPrice: price,
                    lastUpdated: new Date().toString(),
                    movingAverage: price,
                    beingWatched: false
                };

            } catch (error) {
                if (error instanceof InvalidStockSymbolException) {
                    throw error;
                } else if (error instanceof RateLimitExceededException) {
                    throw error;
                } else {
                    throw new Error(`Failed to fetch data for symbol: ${symbol}`);
                }
            }
        }

        const movingAverage = await this.calculateMovingAverage(symbol);

        return {
            symbol,
            currentPrice: latestPrice.price,
            lastUpdated: latestPrice.timestamp,
            movingAverage,
            beingWatched: true
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
        try {
            const price = await this.finnhubService.getStockPrice(symbol);
            await this.prismaService.stockPrice.create({
                data: {
                    symbol,
                    price,
                },
            });

            this.schedulerService.addSymbol(symbol);
        } catch (error) {
            console.log(error);
            throw new InvalidStockSymbolException(symbol);
        }

        return { message: `Started tracking ${symbol}` };
    }

    async stopTracking(symbol: string) {
        await this.prismaService.stockPrice.deleteMany({
            where: { symbol },
        });

        this.schedulerService.removeSymbol(symbol);

        return { message: `Stopped tracking ${symbol}` };
    }
}