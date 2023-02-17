export const debug_mode = 0;

export function getTinderServerAddress() {
    const mode = process.env.NODE_ENV;
    if (mode && mode.trim() === 'development') {
        return 'http://localhost:5555';
    } else {
        // return 'https://triplan-server.herokuapp.com';
        return 'http://localhost:5555';
    }
}
