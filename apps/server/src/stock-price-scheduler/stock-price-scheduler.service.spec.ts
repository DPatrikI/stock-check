import { Test, TestingModule } from '@nestjs/testing';
import { StockPriceSchedulerService } from './stock-price-scheduler.service';
import { FinnhubService } from '../finnhub/finnhub.service';
import { PrismaService } from '../prisma/prisma.service';

jest.useFakeTimers();

describe('StockPriceSchedulerService', () => {
  let service: StockPriceSchedulerService;
  let finnhubService: FinnhubService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockPriceSchedulerService,
        {
          provide: FinnhubService,
          useValue: {
            getStockPrice: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            stockPrice: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<StockPriceSchedulerService>(StockPriceSchedulerService);
    finnhubService = module.get<FinnhubService>(FinnhubService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fetchStockPrices', () => {
    it('should fetch and store stock prices for tracked symbols', async () => {
      service.addSymbol('AAPL');
      service.addSymbol('GOOG');

      (finnhubService.getStockPrice as jest.Mock)
        .mockResolvedValueOnce(150)
        .mockResolvedValueOnce(2500);

      await service.fetchStockPrices();

      expect(finnhubService.getStockPrice).toHaveBeenCalledTimes(2);
      expect(finnhubService.getStockPrice).toHaveBeenCalledWith('AAPL');
      expect(finnhubService.getStockPrice).toHaveBeenCalledWith('GOOG');

      expect(prismaService.stockPrice.create).toHaveBeenCalledTimes(2);
      expect(prismaService.stockPrice.create).toHaveBeenCalledWith({
        data: {
          symbol: 'AAPL',
          price: 150,
        },
      });
      expect(prismaService.stockPrice.create).toHaveBeenCalledWith({
        data: {
          symbol: 'GOOG',
          price: 2500,
        },
      });
    });

    it('should handle errors from finnhubService.getStockPrice', async () => {
      service.addSymbol('AAPL');

      (finnhubService.getStockPrice as jest.Mock).mockRejectedValue(
        new Error('API Error'),
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await service.fetchStockPrices();

      expect(finnhubService.getStockPrice).toHaveBeenCalledWith('AAPL');
      expect(prismaService.stockPrice.create).not.toHaveBeenCalled();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching price for AAPL:',
        'API Error',
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('addSymbol', () => {
    it('should add symbol to tracking set', () => {
      service.addSymbol('MSFT');
      expect(service['symbolsToTrack']).toContain('MSFT');
    });

    it('should convert symbol to uppercase', () => {
      service.addSymbol('msft');
      expect(service['symbolsToTrack']).toContain('MSFT');
    });
  });
});