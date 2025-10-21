import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ReservaEntity } from "src/reservas/entity/reservas.entity";

@Entity({ name: "deporte" })
export class DeporteEntity {
  @PrimaryGeneratedColumn()
  id_deporte: number;

  @Column({ type: "varchar", length: 50, unique: true })
  nombre: string;

  @OneToMany(() => ReservaEntity, (reserva) => reserva.deporte)
  reservas: ReservaEntity[];
}
