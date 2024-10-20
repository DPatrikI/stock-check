import { Test, TestingModule } from '@nestjs/testing';
import { StockPriceSchedulerService } from './stock-price-scheduler.service';

describe('StockPriceSchedulerService', () => {
  let service: StockPriceSchedulerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StockPriceSchedulerService],
    }).compile();

    service = module.get<StockPriceSchedulerService>(StockPriceSchedulerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
