// src/types/express.d.ts

declare namespace Express {
  export interface Request {
    user: {
      userId: number;
      rolId: number;
      // Aquí puedes añadir cualquier otra propiedad que venga en tu payload de JWT
    };
  }
}
