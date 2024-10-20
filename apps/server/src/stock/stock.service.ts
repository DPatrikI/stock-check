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
        symbol = symbol.toUpperCase();

        let stockInDatabase = await this.prismaService.stock.findUnique({
            where: { symbol },
            include: {
                prices: {
                    orderBy: { timestamp: 'desc' },
                    take: 10,
                },
            },
        });

        if (!stockInDatabase) {
            try {
                const price = await this.finnhubService.getStockPrice(symbol);

                return {
                    symbol,
                    currentPrice: price,
                    lastUpdated: new Date().toISOString(),
                    movingAverage: price,
                    beingWatched: false,
                };
            } catch (error) {
                console.log(error);
                if (error instanceof InvalidStockSymbolException) {
                    throw error;
                } else if (error instanceof RateLimitExceededException) {
                    throw error;
                } else {
                    throw new Error(`Failed to fetch data for symbol: ${symbol}`);
                }
            }
        }

        const prices = stockInDatabase.prices;
        const latestPrice = prices[0];
        const movingAverage = this.calculateMovingAverage(prices);
        const beingWatched = this.schedulerService.isSymbolBeingWatched(symbol);

        return {
            symbol,
            currentPrice: latestPrice.price,
            lastUpdated: latestPrice.timestamp,
            movingAverage,
            beingWatched,
        };
    }

    calculateMovingAverage(prices: { price: number }[]): number {
        if (prices.length === 0) {
            return 0;
        }
        const sum = prices.reduce((acc, curr) => acc + curr.price, 0);
        return sum / prices.length;
    }

    async startTracking(symbol: string) {
        symbol = symbol.toUpperCase();
        const price = await this.finnhubService.getStockPrice(symbol);

        const stock = await this.prismaService.stock.create({
            data: {
                symbol,
                prices: {
                    create: {
                        price,
                    },
                },
            },
            include: {
                prices: {
                    orderBy: { timestamp: 'desc' },
                    take: 10,
                },
            },
        });

        this.schedulerService.addSymbol(symbol);
        return { message: `Started tracking ${symbol}` };
    }

    async stopTracking(symbol: string) {
        symbol = symbol.toUpperCase();
        this.schedulerService.removeSymbol(symbol);

        await this.prismaService.stock.delete({
            where: { symbol },
        });

        return { message: `Stopped tracking ${symbol}` };
    }
}