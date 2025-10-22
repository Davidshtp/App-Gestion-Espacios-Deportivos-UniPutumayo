import { UserEntity } from "src/user/entity/user.entity";
import { EspacioEntity } from "src/espacio/entity/espacio.entity";
import { DeporteEntity } from "src/deportes/entity/deportes.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { EventoEntity } from "src/eventos/entity/evento.entity";

@Entity({ name: 'reserva' })
export class ReservaEntity {
    @PrimaryGeneratedColumn()
    id_reserva: number;

    @Column({ type: 'datetime' })
    fecha_hora: Date;

    @Column({ type: 'enum', enum: ['reservado', 'esperando', 'en_uso', 'cancelado', 'usado', 'uso_libre', 'cancelado_antes_de_tiempo'], default: 'reservado' })
    estado: string;

    @ManyToOne(() => UserEntity, user => user.reservas, { nullable: true })
    @JoinColumn({ name: 'usuario_id' })
    usuario: UserEntity | null;

    @ManyToOne(() => EspacioEntity, espacio => espacio.reservas, { onDelete: 'CASCADE' })
    espacio: EspacioEntity;

    @ManyToOne(() => DeporteEntity, (deporte) => deporte.reservas, { nullable: true })
    @JoinColumn({ name: "deporte_id" })
    deporte: DeporteEntity | null;

    @ManyToOne(() => EventoEntity, (evento) => evento.reservas, { nullable: true })
    @JoinColumn({ name: "evento_id" })
    evento: EventoEntity | null;

}
