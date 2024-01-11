#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	CREATE USER pkt_featureflags WITH ENCRYPTED PASSWORD 'password';
	CREATE DATABASE featureflags;
	GRANT ALL PRIVILEGES ON DATABASE featureflags TO pkt_featureflags;
	\c featureflags $POSTGRES_USER;
	GRANT ALL ON SCHEMA public TO pkt_featureflags;
EOSQL