import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ReservaEntity } from "src/reservas/entity/reservas.entity";

@Entity({ name: "espacio" })
export class EspacioEntity {
  @PrimaryGeneratedColumn()
  id_espacio: number;

  @Column({ type: "varchar", length: 25 })
  espacio: string;

  @OneToMany(() => ReservaEntity, (reserva) => reserva.espacio)
  reservas: ReservaEntity[];
}
