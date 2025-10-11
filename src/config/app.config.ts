/**
 * Centralized configuration service that works reliably on Vercel
 * Uses environment variables with fallbacks to default values
 */

export interface DatabaseConfig {
  type: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
  extra: any;
}

export interface JwtConfig {
  secret: string;
  expiresIn: number;
}

export interface ServerConfig {
  port: number;
}

class AppConfig {
  private static instance: AppConfig;

  private constructor() {}

  public static getInstance(): AppConfig {
    if (!AppConfig.instance) {
      AppConfig.instance = new AppConfig();
    }
    return AppConfig.instance;
  }

  public getDatabaseConfig(): DatabaseConfig {

    const supaBase = {
        dbHost: 'aws-1-eu-west-1.pooler.supabase.com',
        port: 6543,
        dbUser: 'postgres.gwewfommgauuuvlgegzo',
        // dbPassword: 'Aa6336263!!',
        database: 'postgres'
    }

    return {
      type: process.env.DB_TYPE || 'postgres',
      host: supaBase['dbHost'] || process.env.DB_HOST || process.env.RDS_HOSTNAME || 'localhost',
      port: supaBase['port'] || parseInt(process.env.DB_PORT || process.env.RDS_PORT || '5432'),
      username: supaBase['dbUser'] || process.env.DB_USERNAME || process.env.RDS_USERNAME || 'postgres',
      password: supaBase['dbPassword'] || process.env.DB_PASSWORD || process.env.RDS_PASSWORD || 'postgres',
      database: supaBase['database'] || process.env.DB_NAME || process.env.RDS_DB_NAME || 'triplan_local',
      synchronize: process.env.TYPEORM_SYNC === 'true' || 
                  process.env.NODE_ENV === 'development' || 
                  false,
      extra: {
        // Add SSL configuration for production databases
        ...(process.env.NODE_ENV === 'production' && {
          ssl: {
            rejectUnauthorized: false,
            require: true,
            mode: 'require'
          }
        })
      }
    };
  }

  public getJwtConfig(): JwtConfig {
    return {
      secret: process.env.JWT_SECRET || 'topSecret51',
      expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '86400')
    };
  }

  public getServerConfig(): ServerConfig {
    return {
      port: parseInt(process.env.PORT || '3001')
    };
  }
}

// Export singleton instance
export const appConfig = AppConfig.getInstance();

// Export convenience functions for backward compatibility
export const getDatabaseConfig = () => appConfig.getDatabaseConfig();
export const getJwtConfig = () => appConfig.getJwtConfig();
export const getServerConfig = () => appConfig.getServerConfig();