import { Test, TestingModule } from '@nestjs/testing';
import { FinnhubService } from './finnhub.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AxiosResponse, AxiosHeaders } from 'axios';

describe('FinnhubService', () => {
  let service: FinnhubService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinnhubService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FinnhubService>(FinnhubService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should return the stock price on success', async () => {
    const mockResponse: AxiosResponse = {
      data: { c: 100 },
      status: 200,
      statusText: 'OK',
      headers: new AxiosHeaders(),
      config: {
        headers: new AxiosHeaders(),
      },
    };

    jest.spyOn(httpService, 'get').mockImplementationOnce(() => of(mockResponse));

    const price = await service.getStockPrice('AAPL');
    expect(price).toBe(100);
  });

  it('should throw an error if the stock price is invalid', async () => {
    const mockResponse: AxiosResponse = {
      data: { c: null },
      status: 200,
      statusText: 'OK',
      headers: new AxiosHeaders(),
      config: {
        headers: new AxiosHeaders(),
      },
    };

    jest.spyOn(httpService, 'get').mockImplementationOnce(() => of(mockResponse));

    await expect(service.getStockPrice('AAPL')).rejects.toThrow(
      new HttpException('Error fetching stock price', HttpStatus.BAD_REQUEST),
    );
  });

  it('should handle exceptions from HttpService', async () => {
    jest.spyOn(httpService, 'get').mockImplementationOnce(() => {
      throw new Error('API Error');
    });

    await expect(service.getStockPrice('AAPL')).rejects.toThrow(
      new HttpException('Error fetching stock price', HttpStatus.BAD_REQUEST),
    );
  });
});