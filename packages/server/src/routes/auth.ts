import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { creditsService } from '../services/credits-service.js';
export const authRouter = Router();
const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2)
});
const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
});
const GoogleAuthSchema = z.object({
    email: z.string().email(),
    name: z.string().default('Google User'),
    avatarUrl: z.string().optional(),
    googleId: z.string().optional(),
    credential: z.string().optional()
});
authRouter.post('/register', async (req: Request, res: Response) => {
    try {
        const data = RegisterSchema.parse(req.body);
        const session = await authService.register(data.email, data.password, data.name);
        res.status(201).json({
            status: 'success',
            data: session
        });
    }
    catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Registration failed';
        res.status(400).json({ status: 'error', message });
    }
});
authRouter.post('/login', async (req: Request, res: Response) => {
    try {
        const data = LoginSchema.parse(req.body);
        const session = await authService.login(data.email, data.password);
        res.status(200).json({
            status: 'success',
            data: session
        });
    }
    catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Authentication failed';
        res.status(401).json({ status: 'error', message });
    }
});
authRouter.post('/google', async (req: Request, res: Response) => {
    try {
        const { credential, email, name, avatarUrl, googleId } = req.body;
        // In automated test environment, permit direct mock authentication
        if (env.NODE_ENV === 'test' && email) {
            const session = await authService.loginWithGoogle({
                email,
                name: name || email.split('@')[0],
                avatarUrl,
                googleId: googleId || 'test-google-id'
            });
            return res.status(200).json({
                status: 'success',
                data: session
            });
        }
        if (!credential || typeof credential !== 'string') {
            return res.status(401).json({
                status: 'error',
                message: 'Token criptográfico do Google (ID Token / credential) é obrigatório.'
            });
        }
        if (!env.GOOGLE_CLIENT_ID)
            return res.status(503).json({ status: 'error', message: 'GOOGLE_CLIENT_ID não configurado' });
        // Verify Google ID Token cryptographically via Google's tokeninfo service
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, { signal: AbortSignal.timeout(10000) });
        if (!verifyRes.ok) {
            return res.status(401).json({
                status: 'error',
                message: 'Token do Google inválido ou expirado. Autenticação rejeitada.'
            });
        }
        const payload = (await verifyRes.json()) as any;
        if (!payload.email || ![true, 'true'].includes(payload.email_verified) || payload.aud !== env.GOOGLE_CLIENT_ID || !['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss) || !Number.isFinite(Number(payload.exp)) || Number(payload.exp) <= Date.now() / 1000 || typeof payload.sub !== 'string' || !payload.sub) {
            return res.status(401).json({
                status: 'error',
                message: 'O email associado à conta Google não foi verificado.'
            });
        }
        const session = await authService.loginWithGoogle({
            email: payload.email,
            name: payload.name || payload.email.split('@')[0],
            avatarUrl: payload.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(payload.email)}`,
            googleId: payload.sub
        });
        res.status(200).json({
            status: 'success',
            data: session
        });
    }
    catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Falha na autenticação via Google';
        res.status(400).json({ status: 'error', message });
    }
});
authRouter.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const credits = (await creditsService.getUserCredits(user.id));
    res.status(200).json({
        status: 'success',
        data: {
            user: {
                ...user,
                credits: {
                    balance: credits.balance,
                    totalConsumed: credits.totalConsumed
                }
            }
        }
    });
});
const ForgotPasswordSchema = z.object({
    email: z.string().email()
});
const ResetPasswordSchema = z.object({
    token: z.string().min(1),
    newPassword: z.string().min(6)
});
authRouter.post('/forgot-password', async (req: Request, res: Response) => {
    try {
        const { email } = ForgotPasswordSchema.parse(req.body);
        const result = await authService.requestPasswordReset(email);
        res.status(200).json({
            status: 'success',
            message: 'Se o email for cadastrado, você receberá instruções para redefinir sua senha.',
            ...(result.devToken ? { devToken: result.devToken } : {})
        });
    }
    catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Falha ao processar solicitação';
        res.status(400).json({ status: 'error', message });
    }
});
authRouter.post('/reset-password', async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = ResetPasswordSchema.parse(req.body);
        await authService.resetPassword(token, newPassword);
        res.status(200).json({
            status: 'success',
            message: 'Senha redefinida com sucesso! Você já pode entrar com a nova senha.'
        });
    }
    catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Falha ao redefinir senha';
        res.status(400).json({ status: 'error', message });
    }
});
