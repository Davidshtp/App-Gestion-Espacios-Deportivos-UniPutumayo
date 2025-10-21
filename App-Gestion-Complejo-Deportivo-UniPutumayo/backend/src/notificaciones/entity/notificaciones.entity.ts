import { UserEntity } from "src/user/entity/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, ManyToMany, JoinTable, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'notificacion' })
export class NotificacionEntity {
    @PrimaryGeneratedColumn()
    id_notificacion: number;

    @Column({ type: 'varchar', length: 100 })
    titulo: string;

    @Column({ type: 'text' })
    mensaje: string;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    fecha: Date;

    // ✅ Individual (ManyToOne → User)
    @ManyToOne(() => UserEntity, user => user.notificacionesIndividuales, { nullable: true })
    @JoinColumn({ name: 'user_id_individual' })
    usuarioIndividual: UserEntity;

    // ✅ Generales (ManyToMany → Users)
    @ManyToMany(() => UserEntity, user => user.notificacionesGenerales)
    @JoinTable({ name: 'usuario_notificaciones_generales' }) // Tabla intermedia
    usuariosGenerales: UserEntity[];
}
