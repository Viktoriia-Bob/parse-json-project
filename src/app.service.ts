import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TestEntity } from './test.entity';

@Injectable()
export class AppService {
  buf: string;
  count: number;

  constructor(
    @InjectRepository(TestEntity)
    private readonly testRepository: Repository<TestEntity>,
  ) {
    this.buf = '';
    this.count = 0;
  }

  getHello(): string {
    return 'Hello World!';
  }

  async getDataFromEnormousFile() {
    const pathToFile = 'gconverted2.json';
    const stream = fs.createReadStream(pathToFile, {
      flags: 'r',
      encoding: 'utf-8',
    });

    stream.on('data', async (data) => {
      this.buf += data.toString();
      await this.pump();
    });

    stream.on('error', (err) => {
      Logger.error(err);
      stream.close();
    });

    return 'ready';
  }

  async pump() {
    let pos;

    const arr = [];

    while ((pos = this.buf.indexOf('\n')) >= 0) {
      if (pos == 0) {
        this.buf = this.buf.slice(1);
        continue;
      }

      arr.push(this.buf.slice(0, pos));
      this.buf = this.buf.slice(pos + 1);
    }

    const arrOfObjs = await Promise.all(
      arr.map((value) => this.processLine(value)),
    );

    await this.testRepository.save(arrOfObjs);

    if (++this.count % 100 === 0) console.log(this.count);
  }

  processLine(line: string) {
    if (line[line.length - 1] == '\r')
      line = line.substring(0, line.length - 1);

    if (line.length > 1 && line !== ',') {
      try {
        if (line[0] === '[' || line[0] === ',') line = line.slice(1);
        if (line[line.length - 1] === ']' || line[line.length - 1] === ',')
          line = line.slice(0, line.length - 1);

        return JSON.parse(line);
      } catch (e) {
        Logger.error(e.message);
        console.log(line);
      }
    }
  }
}
