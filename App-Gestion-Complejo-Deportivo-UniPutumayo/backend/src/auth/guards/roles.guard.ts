import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector){} //Inyectamos reflector para leer los metadatos de las rutas

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
        if(!requiredRoles){
            //Si no hay roles especificados, permitir el acceso de forma predeterminada
            return true;
        }

        ///Obtenemos el usuario de la solicitud HTTP Actual
        const {user} = context.switchToHttp().getRequest();

        if(!requiredRoles.includes(user.role)){
            //Si el usuario no tiene un rol permito, lanza una excepcion Forbidden
            throw new ForbiddenException('No tienes permisos para acceder a esta ruta');
        }
        return true;
    }
}