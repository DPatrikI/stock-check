import { Test, TestingModule } from '@nestjs/testing';
import { FinnhubService } from './finnhub.service';
import { HttpModule } from '@nestjs/axios';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { ConfigModule } from '@nestjs/config';
import { AxiosResponse, AxiosHeaders } from 'axios';
import { InvalidStockSymbolException } from '../exceptions/invalid-stock-symbol.exception';

describe('FinnhubService', () => {
  let service: FinnhubService;
  let httpService: HttpService;

  beforeEach(async () => {
    process.env.FINNHUB_API_KEY = 'test_api_key';

    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule, ConfigModule.forRoot()],
      providers: [FinnhubService],
    }).compile();

    service = module.get<FinnhubService>(FinnhubService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return current stock price', async () => {
    const result: AxiosResponse<any> = {
      data: { c: 150 },
      status: 200,
      statusText: 'OK',
      headers: new AxiosHeaders(),
      config: {
        headers: new AxiosHeaders(),
      },
    };
    jest.spyOn(httpService, 'get').mockImplementationOnce(() => of(result));

    const price = await service.getStockPrice('AAPL');
    expect(price).toEqual(150);
  });

  it('should throw InvalidStockSymbolException when price is null', async () => {
    const result: AxiosResponse<any> = {
      data: { c: null },
      status: 200,
      statusText: 'OK',
      headers: new AxiosHeaders(),
      config: {
        headers: new AxiosHeaders(),
      },
    };
    jest.spyOn(httpService, 'get').mockImplementationOnce(() => of(result));

    await expect(service.getStockPrice('INVALID')).rejects.toThrow(
      InvalidStockSymbolException,
    );
  });
});