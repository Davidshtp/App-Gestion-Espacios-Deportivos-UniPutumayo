import { UserEntity } from 'src/user/entity/user.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'rol' })
export class RolEntity {
  @PrimaryGeneratedColumn()
  id_rol: number;

  @Column({ type: 'varchar', length: 50 })
  rol: string;

  @OneToMany(() => UserEntity, (user) => user.rol)
  usuarios: UserEntity[];
}
