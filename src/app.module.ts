import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestEntity } from './test.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      database: 'test',
      port: 5435,
      username: 'postgres',
      host: 'localhost',
      password: 'password',
      entities: [TestEntity],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([TestEntity]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
