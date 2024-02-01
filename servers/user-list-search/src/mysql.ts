import config from './config';
import { get } from 'lodash';
import { FieldPacket, PoolOptions, RowDataPacket } from 'mysql2';
import mysqlPromise from 'mysql2/promise';

export type QueryResult = [RowDataPacket[], FieldPacket[]];
export type Pool = {
  query: (sql: string, args?: any[]) => Promise<QueryResult>;
};

export const poolFactory = (config: PoolOptions): Pool => {
  return mysqlPromise.createPool(config);
};

// TODO: When we move to dependency injection we will no longer require this.
export const poolFromConfigFactory = (
  configPath: string,
): (() => Promise<Pool>) => {
  let pool: Pool;

  return async (): Promise<Pool> => {
    if (!pool) {
      console.log(`creating new connection pool ${configPath}`);

      const cfg = await config();
      pool = poolFactory({
        ...(get(cfg, configPath) as object),
        waitForConnections: true,
      });
    }

    return pool;
  };
};
