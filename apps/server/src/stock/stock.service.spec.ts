import { Test, TestingModule } from '@nestjs/testing';
import { StockService } from './stock.service';
import { PrismaService } from '../prisma/prisma.service';
import { StockPriceSchedulerService } from '../stock-price-scheduler/stock-price-scheduler.service';

describe('StockService', () => {
  let service: StockService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        {
          provide: PrismaService,
          useValue: {
            stockPrice: {
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: StockPriceSchedulerService,
          useValue: {
            addSymbol: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should calculate the moving average for a symbol with 10 prices', async () => {
    const mockPrices = [
      { id: 1, symbol: 'AAPL', price: 100, timestamp: new Date() },
      { id: 2, symbol: 'AAPL', price: 110, timestamp: new Date() },
      { id: 3, symbol: 'AAPL', price: 120, timestamp: new Date() },
      { id: 4, symbol: 'AAPL', price: 130, timestamp: new Date() },
      { id: 5, symbol: 'AAPL', price: 140, timestamp: new Date() },
      { id: 6, symbol: 'AAPL', price: 150, timestamp: new Date() },
      { id: 7, symbol: 'AAPL', price: 160, timestamp: new Date() },
      { id: 8, symbol: 'AAPL', price: 170, timestamp: new Date() },
      { id: 9, symbol: 'AAPL', price: 180, timestamp: new Date() },
      { id: 10, symbol: 'AAPL', price: 190, timestamp: new Date() },
    ];

    jest.spyOn(prismaService.stockPrice, 'findMany').mockResolvedValue(mockPrices);

    const movingAverage = await service.calculateMovingAverage('AAPL');

    const expectedAverage = mockPrices.reduce((sum, item) => sum + item.price, 0) / mockPrices.length;
    expect(movingAverage).toBe(expectedAverage);
  });
});