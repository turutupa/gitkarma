import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import log from "log.ts";
import type { TJWT } from "../types/JWT.ts";

// Extend Express Request to include TUser data.
declare global {
  namespace Express {
    interface Request {
      jwt: TJWT;
    }
  }
}

export function jwtMiddleware(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token missing" });
    return;
  }
  const token = auth.split(" ")[1];
  try {
    const jwtSecret = process.env.JWT_SECRET || "defaultSecret";
    const payload = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] });
    req.jwt = payload as TJWT;
    log.debug({ jwt: payload }, "JWT token verified");
    next();
  } catch (error) {
    log.error({ error }, "JWT token invalid");
    res.status(401).json({ error: "Token invalid" });
  }
}
