export const debug_mode = 0;
import * as path from 'path';

export function getTinderServerAddress() {
    const mode = process.env.NODE_ENV;
    if (mode && mode.trim() === 'development') {
        return 'http://localhost:5555';
    } else {
        // return 'https://triplan-server.herokuapp.com';
        return 'http://localhost:5555';
    }
}

export function getFrontendAddress() {
    const mode = process.env.NODE_ENV;
    if (mode && mode.trim() === 'development') {
        // return 'http://localhost:3000';
        return path.join(__dirname, '..', '..', '..', 'frontend', 'public'); // Adjust to your frontend path
    } else {
        return 'https://tr1plan.herokuapp.com';
    }
}
