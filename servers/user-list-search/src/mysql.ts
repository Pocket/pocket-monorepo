import AWSXRay from 'aws-xray-sdk-core';
import config from './config';
import { get } from 'lodash';
import { FieldPacket, PoolOptions, RowDataPacket } from 'mysql2';
import mysqlPromise from 'mysql2/promise';

export type QueryResult = [RowDataPacket[], FieldPacket[]];
export type Pool = {
  query: (sql: string, args?: any[]) => Promise<QueryResult>;
};

const DATABASE_VERS = process.env.MYSQL_DATABASE_VERSION;
const DRIVER_VERS = process.env.MYSQL_DRIVER_VERSION;

export const poolFactory = (config: PoolOptions): Pool => {
  const pool = mysqlPromise.createPool(config);

  return {
    async query(sql: string, args?: any[]): Promise<QueryResult> {
      return AWSXRay.captureAsyncFunc<Promise<QueryResult>>(
        `${config.user}@${config.host}`,
        async (sub) => {
          // TODO: Sanitize query
          sub?.addSqlData({
            url: `jdbc:mysql://${config.user}@${config.host}:${config.port}`,
            preparation: 'statement',
            database_type: 'MySql',
            database_version: DATABASE_VERS,
            driver_version: DRIVER_VERS,
            user: config.user,
            sanitized_query: sql,
          });

          let result;
          try {
            result = await pool.query(sql, args);
            sub?.close();
          } catch (e) {
            sub?.close(e);
            throw e;
          }
          return result;
        }
      );
    },
  };
};

// TODO: When we move to dependency injection we will no longer require this.
export const poolFromConfigFactory = (
  configPath: string
): (() => Promise<Pool>) => {
  let pool: Pool;

  return async (): Promise<Pool> => {
    if (!pool) {
      console.log(`creating new connection pool ${configPath}`);

      const cfg = await config();
      pool = poolFactory({
        ...get(cfg, configPath),
        waitForConnections: true,
      });
    }

    return pool;
  };
};
