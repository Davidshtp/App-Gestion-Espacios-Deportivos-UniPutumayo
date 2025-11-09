import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ReservaEntity } from 'src/reservas/entity/reservas.entity';
import { DeporteEntity } from 'src/deportes/entity/deportes.entity';

@Entity({ name: 'espacio' })
export class EspacioEntity {
  @PrimaryGeneratedColumn()
  id_espacio: number;

  @Column({ type: 'varchar', length: 25 })
  espacio: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imagen_url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  qr_code: string;

  @OneToMany(() => ReservaEntity, (reserva) => reserva.espacio, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  reservas: ReservaEntity[];

  @ManyToMany(() => DeporteEntity)
  @JoinTable({
    name: 'espacio_deporte',
    joinColumn: { name: 'espacio_id', referencedColumnName: 'id_espacio' },
    inverseJoinColumn: {
      name: 'deporte_id',
      referencedColumnName: 'id_deporte',
    },
  })
  deportes: DeporteEntity[];
}
