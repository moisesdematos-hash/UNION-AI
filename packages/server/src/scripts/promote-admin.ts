import { authService } from '../services/auth.js';
import { getOperationalDatabase, closeOperationalDatabase } from '../db/operational-database.js';
const email = process.argv[2]?.trim().toLowerCase();
if (!email)
    throw new Error('Uso: npm run admin:promote -- <email> (apenas consola privada do operador)');
try {
    const user = await getOperationalDatabase().prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (!user)
        throw new Error('Utilizador não encontrado');
    await authService.updateUserRole(user.id, 'ADMIN');
    console.log('Administrador promovido pela consola privada');
}
finally {
    await closeOperationalDatabase();
}
