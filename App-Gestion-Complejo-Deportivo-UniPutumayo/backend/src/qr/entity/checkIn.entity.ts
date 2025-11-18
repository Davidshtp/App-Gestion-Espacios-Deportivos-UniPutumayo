import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("check_in")
export class CheckIn {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  inscripcionId: number;

  @Column({ unique: true })
  token: string;

  @Column({ default: false })
  escaneado: boolean;

  @Column({ nullable: true })
  fechaEscaneo?: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  fechaGeneracion: Date;
}
