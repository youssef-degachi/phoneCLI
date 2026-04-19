import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config.js';

export const verifyPin = async (pin: string): Promise<boolean> => {
    return bcrypt.compare(pin, env.PIN_HASH);
};

export const signToken = (payload: object): string => {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRY as any });
};

export const verifyToken = (token: string): any => {
    try {
        return jwt.verify(token, env.JWT_SECRET);
    } catch (error) {
        return null;
    }
};
