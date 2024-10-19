import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

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
                throw new Error('Invalid response from Finnhub API');
            }
            return currentPrice;
        } catch (error) {
            console.log(error);
            throw new HttpException(
                'Error fetching stock price',
                HttpStatus.BAD_REQUEST,
            );
        }
    }
}