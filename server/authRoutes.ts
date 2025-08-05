
import { Router } from 'express';
import { AuthRoutes } from './routes';

const authRouter = Router();

// Authentication routes
authRouter.post('/student-login', AuthRoutes.studentLogin);
authRouter.post('/email-login', AuthRoutes.emailLogin);
authRouter.post('/login', AuthRoutes.loginWithPassword);
authRouter.get('/user', AuthRoutes.getUser);
authRouter.post('/setup-email', AuthRoutes.setupEmail);
authRouter.post('/skip-email-setup', AuthRoutes.skipEmailSetup);
authRouter.post('/logout', AuthRoutes.logout);
authRouter.get('/test', AuthRoutes.testConfig);

export { authRouter };
