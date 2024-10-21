import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FinnhubService } from '../finnhub/finnhub.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StockPriceSchedulerService {
    private symbolsToTrack: Set<string> = new Set();

    constructor(
        private readonly finnhubService: FinnhubService,
        private readonly prismaService: PrismaService,
    ) { }

    async onModuleInit() {
        const stocks = await this.prismaService.stock.findMany({
            select: { symbol: true },
        });
        stocks.forEach((stock) => {
            this.symbolsToTrack.add(stock.symbol.toUpperCase());
        });
        console.log('Scheduler initialized with symbols:', Array.from(this.symbolsToTrack));
    }


    @Cron(CronExpression.EVERY_MINUTE)
    async fetchStockPrices() {
        for (const symbol of this.symbolsToTrack) {
            try {
                const price = await this.finnhubService.getStockPrice(symbol);

                await this.prismaService.stockPrice.create({
                    data: {
                        price,
                        stockSymbol: symbol,
                    },
                });

                const priceIdsToKeep = (
                    await this.prismaService.stockPrice.findMany({
                        where: { stockSymbol: symbol },
                        select: { id: true },
                        orderBy: { timestamp: 'desc' },
                        take: 10,
                    })
                ).map((price) => price.id);

                await this.prismaService.stockPrice.deleteMany({
                    where: {
                        stockSymbol: symbol,
                        id: {
                            notIn: priceIdsToKeep,
                        },
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

    removeSymbol(symbol: string) {
        this.symbolsToTrack.delete(symbol.toUpperCase());
    }

    isSymbolBeingWatched(symbol: string): boolean {
        return this.symbolsToTrack.has(symbol.toUpperCase());
    }
}