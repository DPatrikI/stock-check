import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { InvalidStockSymbolException } from '../exceptions/invalid-stock-symbol.exception';
import { RateLimitExceededException } from '../exceptions/rate-limit-exceeded.exception';

@Injectable()
export class FinnhubService {
    private readonly apiKey: string;

    constructor(private readonly httpService: HttpService) {
        this.apiKey = process.env.FINNHUB_API_KEY;
    }

    async getStockPrice(symbol: string): Promise<number> {
        const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${this.apiKey}`;
        try {
            const response = await lastValueFrom(this.httpService.get(url));
            const currentPrice = response.data.c;
            if (currentPrice === null || currentPrice === undefined) {
                throw new InvalidStockSymbolException(symbol);
            }
            return currentPrice;
        } catch (error) {
            console.log(error);
            if (error.response && error.status === 429) {
                throw new RateLimitExceededException();
            }
            if (error.response && error.status === 400) {
                throw new InvalidStockSymbolException(symbol);
            }
            throw new HttpException(
                'Error fetching stock price',
                HttpStatus.BAD_REQUEST,
            );
        }
    }
}