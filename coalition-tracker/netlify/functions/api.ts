import { handle } from 'hono/netlify';
import app from '../../src/api/routes';

export default handle(app);
