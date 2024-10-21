import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FinnhubService } from './finnhub/finnhub.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { StockPriceSchedulerService } from './stock-price-scheduler/stock-price-scheduler.service';
import { ScheduleModule } from '@nestjs/schedule';
import { StockController } from './stock/stock.controller';
import { StockService } from './stock/stock.service';

@Module({
  imports: [ConfigModule.forRoot(), ScheduleModule.forRoot(), HttpModule],
  controllers: [AppController, StockController],
  providers: [AppService, FinnhubService, PrismaService, StockPriceSchedulerService, StockService],
})
export class AppModule { }
