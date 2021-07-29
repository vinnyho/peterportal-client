declare global {
    namespace NodeJS {
        interface ProcessEnv {
            MONGO_URL: string;
            NODE_ENV: 'development' | 'production';
            PORT?: string;
            PUBLIC_API_URL: string;
            PUBLIC_API_GRAPHQL_URL: string;
            PETERPORTAL_MAIN_ES: string;
            MONGO_URL: string;
            PPAPI_KEY: string;
            SESSION_SECRET: string;
            GOOGLE_CLIENT: string;
            GOOGLE_SECRET: string;
            PRODUCTION_DOMAIN: string;
            GITHUB_ADMIN_USERNAMES: string;
        }
    }
}

export {}