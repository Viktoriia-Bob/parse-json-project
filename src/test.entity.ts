import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class TestEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstField: string;

  @Column()
  secondField: string;

  @Column()
  thirdField: string;

  @Column()
  fourthField: string;

  @Column()
  fifthField: string;

  @Column()
  sixthField: string;

  @Column()
  seventhField: string;

  @Column()
  eigthField: string;
}
