import mysql from 'mysql2';
import { getMysqlConfigFromString, config } from '../../config';

export const primaryPool = mysql
  .createPool(getMysqlConfigFromString(config.ecsMySqlConfig.readitla))
  .promise();
