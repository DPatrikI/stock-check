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
    const prismaMock = {
      stock: {
        findMany: jest.fn(),
      },
      stockPrice: {
        create: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

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
          useValue: prismaMock,
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

  describe('onModuleInit', () => {
    it('should initialize symbolsToTrack from database', async () => {
      const mockStocks: { symbol: string }[] = [
        { symbol: 'AAPL' },
        { symbol: 'GOOG' },
      ];
      jest.spyOn(prismaService.stock, 'findMany').mockResolvedValue(mockStocks);

      await service.onModuleInit();

      expect(prismaService.stock.findMany).toHaveBeenCalledWith({
        select: { symbol: true },
      });
      expect(Array.from(service['symbolsToTrack'])).toEqual(['AAPL', 'GOOG']);
    });
  });

  describe('fetchStockPrices', () => {
    it('should fetch and store stock prices for tracked symbols', async () => {
      service.addSymbol('AAPL');
      service.addSymbol('GOOG');

      (finnhubService.getStockPrice as jest.Mock)
        .mockResolvedValueOnce(150)
        .mockResolvedValueOnce(2500);

      (prismaService.stockPrice.findMany as jest.Mock)
        .mockResolvedValueOnce([{ id: 1 }, { id: 2 }]) // For AAPL
        .mockResolvedValueOnce([{ id: 3 }, { id: 4 }]); // For GOOG

      await service.fetchStockPrices();

      expect(finnhubService.getStockPrice).toHaveBeenCalledTimes(2);
      expect(finnhubService.getStockPrice).toHaveBeenCalledWith('AAPL');
      expect(finnhubService.getStockPrice).toHaveBeenCalledWith('GOOG');

      expect(prismaService.stockPrice.create).toHaveBeenCalledTimes(2);
      expect(prismaService.stockPrice.create).toHaveBeenCalledWith({
        data: {
          stockSymbol: 'AAPL',
          price: 150,
        },
      });
      expect(prismaService.stockPrice.create).toHaveBeenCalledWith({
        data: {
          stockSymbol: 'GOOG',
          price: 2500,
        },
      });

      expect(prismaService.stockPrice.findMany).toHaveBeenCalledTimes(2);
      expect(prismaService.stockPrice.findMany).toHaveBeenCalledWith({
        where: { stockSymbol: 'AAPL' },
        select: { id: true },
        orderBy: { timestamp: 'desc' },
        take: 10,
      });
      expect(prismaService.stockPrice.findMany).toHaveBeenCalledWith({
        where: { stockSymbol: 'GOOG' },
        select: { id: true },
        orderBy: { timestamp: 'desc' },
        take: 10,
      });

      expect(prismaService.stockPrice.deleteMany).toHaveBeenCalledTimes(2);
      expect(prismaService.stockPrice.deleteMany).toHaveBeenCalledWith({
        where: {
          stockSymbol: 'AAPL',
          id: { notIn: [1, 2] },
        },
      });
      expect(prismaService.stockPrice.deleteMany).toHaveBeenCalledWith({
        where: {
          stockSymbol: 'GOOG',
          id: { notIn: [3, 4] },
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
        `Error fetching price for AAPL:`,
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

  describe('removeSymbol', () => {
    it('should remove symbol from tracking set', () => {
      service.addSymbol('AAPL');
      expect(service['symbolsToTrack']).toContain('AAPL');
      service.removeSymbol('AAPL');
      expect(service['symbolsToTrack']).not.toContain('AAPL');
    });
  });

  describe('isSymbolBeingWatched', () => {
    it('should return true if symbol is being watched', () => {
      service.addSymbol('AAPL');
      expect(service.isSymbolBeingWatched('AAPL')).toBe(true);
    });

    it('should return false if symbol is not being watched', () => {
      expect(service.isSymbolBeingWatched('AAPL')).toBe(false);
    });
  });
});