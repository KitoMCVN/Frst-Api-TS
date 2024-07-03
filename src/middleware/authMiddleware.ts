import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";
import { sendAuthError } from "../utils/responseHandler";

declare module "express-serve-static-core" {
  interface Request {
    user?: IUser;
  }
}

const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
      req.user = (await User.findById(decoded.id).select("-password")) || undefined;
      next();
    } catch (error) {
      sendAuthError(res, "Looks like you don't have the secret handshake for access!");
      return;
    }
  } else {
    sendAuthError(res, "No token, no magic portal for you!");
  }
};

const admin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === "ADMIN") {
    next();
  } else {
    sendAuthError(res, "Not authorized as an admin");
  }
};

export { protect, admin };