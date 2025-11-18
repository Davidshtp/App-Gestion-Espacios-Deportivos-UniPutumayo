import { UserEntity } from "src/user/entity/user.entity";
import { EspacioEntity } from "src/espacio/entity/espacio.entity";
import { DeporteEntity } from "src/deportes/entity/deportes.entity";
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { EventoEntity } from "src/eventos/entity/evento.entity";

@Entity("reservas")
export class ReservaEntity {
    @PrimaryGeneratedColumn()
    id_reserva: number;

    @Column({ type: "datetime" })
    fecha_hora: Date;

    @Column({
        type: "enum",
        enum: [
            "reservado",                 // Reserva creada
            "esperando",                 // QR generado pero no escaneado
            "check_in_previo",           // Usuario escaneó antes de la hora exacta
            "en_uso",                    // Check-in válido o inicio automático
            "cancelado",
            "usado",
            "uso_libre",                 // Pasaron los 15 min, nadie llegó
            "cancelado_antes_de_tiempo"
        ],
        default: "reservado"
    })
    estado: string;

    @ManyToOne(() => UserEntity, (user) => user.reservas, { nullable: true })
    @JoinColumn({ name: "usuario_id" })
    usuario: UserEntity | null;

    @ManyToOne(() => EspacioEntity, (espacio) => espacio.reservas, { onDelete: "CASCADE" })
    @JoinColumn({ name: "espacio_id" })
    espacio: EspacioEntity;

    @ManyToOne(() => DeporteEntity, (deporte) => deporte.reservas, { nullable: true })
    @JoinColumn({ name: "deporte_id" })
    deporte: DeporteEntity | null;

    @ManyToOne(() => EventoEntity, (evento) => evento.reservas, { nullable: true })
    @JoinColumn({ name: "evento_id" })
    evento: EventoEntity | null;

    // --- QR ---

    @Index({ unique: true })
    @Column({ type: "varchar", length: 255, nullable: true })
    qr_token?: string | null;

    @Column({ type: "datetime", nullable: true })
    qr_available_from?: Date | null;

    @Column({ type: "datetime", nullable: true })
    qr_expires_at?: Date | null;

    @Column({ type: "datetime", nullable: true })
    qr_used_at?: Date | null;
}
