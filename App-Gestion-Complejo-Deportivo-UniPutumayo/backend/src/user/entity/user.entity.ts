import { NotificacionEntity } from "src/notificaciones/entity/notificaciones.entity";
import { ReservaEntity } from "src/reservas/entity/reservas.entity";
import { RolEntity } from "src/rol/entity/rol.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, ManyToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'user' })
export class UserEntity {
    @PrimaryGeneratedColumn()
    usuario_id: number;

    @Column({ type: 'varchar', length: 50 })
    nombre: string;

    @Column({ type: 'varchar', length: 50 })
    apellido: string;

    @Column({ type: 'varchar', length: 25, unique: true })
    identificacion: string;

    @Column({ type: 'varchar' })
    contrasena: string;

    @Column({ type: 'varchar', length: 50, unique: true, nullable:true })
    correo: string;

    @Column({ type: 'varchar', nullable: true })
    urlimage: string 

    @Column({ type: 'varchar', nullable : true })
    pdfpath: string 

    @ManyToOne(() => RolEntity, rol => rol.usuarios)
    @JoinColumn({ name: 'id_rol' })
    rol: RolEntity;

    @OneToMany(() => ReservaEntity, reserva => reserva.usuario)
    reservas: ReservaEntity[];

    // ✅ Notificaciones individuales (ManyToOne → User)
    @OneToMany(() => NotificacionEntity, notificacion => notificacion.usuarioIndividual)
    notificacionesIndividuales: NotificacionEntity[];

    // ✅ Notificaciones generales (ManyToMany → Users)
    @ManyToMany(() => NotificacionEntity, notificacion => notificacion.usuariosGenerales)
    notificacionesGenerales: NotificacionEntity[];
}
