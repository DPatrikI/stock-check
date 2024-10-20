import { HttpException, HttpStatus } from '@nestjs/common';

export class InvalidStockSymbolException extends HttpException {
    constructor(symbol: string) {
        super(`Invalid stock symbol: ${symbol}`, HttpStatus.BAD_REQUEST);
    }
}