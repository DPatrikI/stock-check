import { Test, TestingModule } from '@nestjs/testing';
import { StockService } from './stock.service';
import { PrismaService } from '../prisma/prisma.service';
import { FinnhubService } from '../finnhub/finnhub.service';
import { StockPriceSchedulerService } from '../stock-price-scheduler/stock-price-scheduler.service';
import { InvalidStockSymbolException } from '../exceptions/invalid-stock-symbol.exception';
import { RateLimitExceededException } from '../exceptions/rate-limit-exceeded.exception';
import { Stock, StockPrice } from '@prisma/client';

describe('StockService', () => {
  let service: StockService;
  let prismaService: PrismaService;
  let finnhubService: FinnhubService;
  let schedulerService: StockPriceSchedulerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        {
          provide: PrismaService,
          useValue: {
            stock: {
              findUnique: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: FinnhubService,
          useValue: {
            getStockPrice: jest.fn(),
          },
        },
        {
          provide: StockPriceSchedulerService,
          useValue: {
            isSymbolBeingWatched: jest.fn(),
            addSymbol: jest.fn(),
            removeSymbol: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
    prismaService = module.get<PrismaService>(PrismaService);
    finnhubService = module.get<FinnhubService>(FinnhubService);
    schedulerService = module.get<StockPriceSchedulerService>(StockPriceSchedulerService);
  });

  describe('calculateMovingAverage', () => {
    it('should calculate the moving average of given prices', () => {
      const prices = [
        { price: 100 },
        { price: 110 },
        { price: 120 },
        { price: 130 },
        { price: 140 },
        { price: 150 },
        { price: 160 },
        { price: 170 },
        { price: 180 },
        { price: 190 },
      ];
      const expectedAverage = prices.reduce((sum, item) => sum + item.price, 0) / prices.length;
      const movingAverage = service.calculateMovingAverage(prices);
      expect(movingAverage).toBe(expectedAverage);
    });

    it('should return 0 if prices array is empty', () => {
      const prices = [];
      const movingAverage = service.calculateMovingAverage(prices);
      expect(movingAverage).toBe(0);
    });
  });

  describe('getStockData', () => {
    it('should return stock data from the database if stock exists', async () => {
      const symbol = 'AAPL';
      const mockStockInDatabase = {
        symbol,
        prices: [
          { price: 150, timestamp: '2023-10-01T00:00:00Z' },
          { price: 145, timestamp: '2023-09-30T00:00:00Z' },
        ],
      };
      jest.spyOn(prismaService.stock, 'findUnique').mockResolvedValue(mockStockInDatabase);
      jest.spyOn(schedulerService, 'isSymbolBeingWatched').mockReturnValue(true);

      const expectedMovingAverage = service.calculateMovingAverage(mockStockInDatabase.prices);

      const result = await service.getStockData(symbol);

      expect(result).toEqual({
        symbol,
        currentPrice: mockStockInDatabase.prices[0].price,
        lastUpdated: mockStockInDatabase.prices[0].timestamp,
        movingAverage: expectedMovingAverage,
        beingWatched: true,
      });
    });

    it('should fetch stock data from Finnhub if stock does not exist in database', async () => {
      const symbol = 'AAPL';
      const mockPrice = 150;
      jest.spyOn(prismaService.stock, 'findUnique').mockResolvedValue(null);
      jest.spyOn(finnhubService, 'getStockPrice').mockResolvedValue(mockPrice);

      const result = await service.getStockData(symbol);

      expect(result).toEqual({
        symbol,
        currentPrice: mockPrice,
        lastUpdated: expect.any(String),
        movingAverage: mockPrice,
        beingWatched: false,
      });
    });

    it('should throw InvalidStockSymbolException if Finnhub returns null', async () => {
      const symbol = 'INVALID';
      jest.spyOn(prismaService.stock, 'findUnique').mockResolvedValue(null);
      jest.spyOn(finnhubService, 'getStockPrice').mockResolvedValue(null);

      await expect(service.getStockData(symbol)).rejects.toThrow(InvalidStockSymbolException);
    });

    it('should throw RateLimitExceededException if Finnhub throws RateLimitExceededException', async () => {
      const symbol = 'AAPL';
      jest.spyOn(prismaService.stock, 'findUnique').mockResolvedValue(null);
      jest.spyOn(finnhubService, 'getStockPrice').mockRejectedValue(new RateLimitExceededException());

      await expect(service.getStockData(symbol)).rejects.toThrow(RateLimitExceededException);
    });

    it('should throw generic error if Finnhub throws an unexpected error', async () => {
      const symbol = 'AAPL';
      jest.spyOn(prismaService.stock, 'findUnique').mockResolvedValue(null);
      jest.spyOn(finnhubService, 'getStockPrice').mockRejectedValue(new Error('Unexpected Error'));

      await expect(service.getStockData(symbol)).rejects.toThrowError(`Failed to fetch data for symbol: ${symbol}`);
    });
  });

  describe('startTracking', () => {
    it('should start tracking a stock', async () => {
      const symbol = 'AAPL';
      const mockPrice = 150;

      jest.spyOn(finnhubService, 'getStockPrice').mockResolvedValue(mockPrice);

      const mockStock: Stock & { prices: StockPrice[] } = {
        symbol,
        prices: [
          {
            id: 1,
            stockSymbol: symbol,
            price: mockPrice,
            timestamp: new Date(),
          },
        ],
      };

      jest.spyOn(prismaService.stock, 'create').mockResolvedValue(mockStock);

      jest.spyOn(schedulerService, 'addSymbol').mockImplementation(() => { });

      const result = await service.startTracking(symbol);

      expect(finnhubService.getStockPrice).toHaveBeenCalledWith(symbol);
      expect(prismaService.stock.create).toHaveBeenCalledWith({
        data: {
          symbol,
          prices: {
            create: {
              price: mockPrice,
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
      expect(schedulerService.addSymbol).toHaveBeenCalledWith(symbol);
      expect(result).toEqual({ message: `Started tracking ${symbol}` });
    });

    it('should throw InvalidStockSymbolException if Finnhub returns null', async () => {
      const symbol = 'INVALID';
      jest.spyOn(finnhubService, 'getStockPrice').mockResolvedValue(null);

      await expect(service.startTracking(symbol)).rejects.toThrow(InvalidStockSymbolException);
    });
  });

  describe('stopTracking', () => {
    it('should stop tracking a stock', async () => {
      const symbol = 'AAPL';

      const mockStock: Stock = {
        symbol,
      };

      jest.spyOn(schedulerService, 'removeSymbol').mockImplementation(() => { });

      jest.spyOn(prismaService.stock, 'delete').mockResolvedValue(mockStock);

      const result = await service.stopTracking(symbol);

      expect(schedulerService.removeSymbol).toHaveBeenCalledWith(symbol);
      expect(prismaService.stock.delete).toHaveBeenCalledWith({ where: { symbol } });
      expect(result).toEqual({ message: `Stopped tracking ${symbol}` });
    });
  });
});