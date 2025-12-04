import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('configuracion')
export class ConfiguracionEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  clave: string; // Ej: 'qr_minutos_antes', 'qr_minutos_despues'

  @Column({ type: 'int' })
  valor: number; // El valor numérico (ej: 5, 15, 30)

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion: string; // Descripción para el admin

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
