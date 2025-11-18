// src/types/request.d.ts
import 'express';

declare module 'express' {
  export interface Request {
    user: {
      userId: number;
      rolId: number;
    };
  }
}
