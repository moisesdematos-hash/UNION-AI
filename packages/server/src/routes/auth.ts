import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

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

authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const data = RegisterSchema.parse(req.body);
    const session = await authService.register(data.email, data.password, data.name);
    res.status(201).json({
      status: 'success',
      data: session
    });
  } catch (err: unknown) {
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    res.status(401).json({ status: 'error', message });
  }
});

authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    status: 'success',
    data: { user: req.user }
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
  } catch (err: unknown) {
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao redefinir senha';
    res.status(400).json({ status: 'error', message });
  }
});
