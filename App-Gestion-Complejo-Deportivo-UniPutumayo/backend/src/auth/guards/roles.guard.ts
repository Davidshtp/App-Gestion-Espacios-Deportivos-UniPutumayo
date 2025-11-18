import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector){} //Inyectamos reflector para leer los metadatos de las rutas

    canActivate(context: ExecutionContext): boolean {
        // Leer roles desde metadatos (método o controlador)
        const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
            context.getHandler(),
            context.getClass(),
        ]);

        if(!requiredRoles){
            return true;
        }

        const req = context.switchToHttp().getRequest();
        const user = req.user;

        if(!user) {
            throw new UnauthorizedException('Usuario no autenticado');
        }

        let userRole: string | undefined;
        if (typeof user.role === 'string') {
            userRole = user.role;
        } else if (typeof user.rol === 'string') {
            userRole = user.rol;
        } else if (user.rol && typeof user.rol.rol === 'string') {
            userRole = user.rol.rol;
        } else if (user.role && typeof user.role.rol === 'string') {
            userRole = user.role.rol;
        }

        if (!userRole) {
            throw new ForbiddenException('No tienes permisos para acceder a esta ruta');
        }

        const normalizedUserRole = userRole.toLowerCase().trim();
        const normalizedRequired = requiredRoles.map(r => r.toLowerCase().trim());

        if(!normalizedRequired.includes(normalizedUserRole)){
            throw new ForbiddenException('No tienes permisos para acceder a esta ruta');
        }

        return true;
    }
}