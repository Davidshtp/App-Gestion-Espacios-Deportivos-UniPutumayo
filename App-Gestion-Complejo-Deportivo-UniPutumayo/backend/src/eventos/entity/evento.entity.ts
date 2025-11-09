// src/eventos/entity/evento.entity.ts
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ReservaEntity } from '../../reservas/entity/reservas.entity';

@Entity('eventos') // Tu tabla se llama 'eventos'
export class EventoEntity {
  @PrimaryGeneratedColumn()
  id_evento: number;

  @Column({ unique: true })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  url_imagen_evento: string | null;

  @Column({ type: 'datetime', nullable: true })
  fecha_hora_evento: Date;

  @Column({ type: 'enum', enum: ['activo', 'inactivo'], default: 'activo' })
  estado: 'activo' | 'inactivo';

  @OneToMany(() => ReservaEntity, (reserva) => reserva.evento)
  reservas: ReservaEntity[];
}
