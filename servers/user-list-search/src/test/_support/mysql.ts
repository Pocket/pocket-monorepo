import mysql from 'mysql2';
import { getMysqlConfigFromString } from '../../config';

export const primaryPool = mysql
  .createPool(getMysqlConfigFromString(process.env.READITLA_DB))
  .promise();
export const contentAuroraDbPool = mysql
  .createPool(getMysqlConfigFromString(process.env.CONTENT_AURORA_DB))
  .promise();
