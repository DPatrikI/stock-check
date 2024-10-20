import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FinnhubService } from './finnhub/finnhub.service';
import { HttpModule } from '@nestjs/axios';
import { FinnhubController } from './finnhub/finnhub.controller';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [ConfigModule.forRoot(), HttpModule],
  controllers: [AppController, FinnhubController],
  providers: [AppService, FinnhubService, PrismaService],
})
export class AppModule { }
