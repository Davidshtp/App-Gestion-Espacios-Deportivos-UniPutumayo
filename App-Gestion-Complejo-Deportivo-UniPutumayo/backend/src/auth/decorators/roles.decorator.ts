import { SetMetadata } from "@nestjs/common";

//Definimos un decorador personalizado llamado Roles para asignar roles a las rutas o controladores
export const Roles = (...roles: string[]) => SetMetadata('roles', roles)
//Este decorador se utiliza para asignar roles a las rutas o controladores