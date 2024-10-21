import { Test, TestingModule } from '@nestjs/testing';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { SymbolParam } from './symbol-param.dto';

describe('StockController', () => {
  let controller: StockController;
  let service: StockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockController],
      providers: [
        {
          provide: StockService,
          useValue: {
            getStockData: jest.fn(),
            startTracking: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<StockController>(StockController);
    service = module.get<StockService>(StockService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStock', () => {
    it('should return stock data', async () => {
      const symbolParam = { symbol: 'AAPL' } as SymbolParam;

      const mockResult = {
        symbol: 'AAPL',
        currentPrice: 150,
        lastUpdated: new Date(),
        movingAverage: 149.8,
      };

      (service.getStockData as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.getStock(symbolParam);
      expect(service.getStockData).toHaveBeenCalledWith('AAPL');
      expect(result).toEqual(mockResult);
    });
  });

  describe('startTracking', () => {
    it('should start tracking a symbol', async () => {
      const symbolParam = { symbol: 'AAPL' } as SymbolParam;

      const mockResult = { message: 'Started tracking AAPL' };

      (service.startTracking as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.startTracking(symbolParam);
      expect(service.startTracking).toHaveBeenCalledWith('AAPL');
      expect(result).toEqual(mockResult);
    });
  });
});