#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	CREATE USER pkt_notes WITH ENCRYPTED PASSWORD 'password';
	CREATE DATABASE pocketnotes;
	GRANT ALL PRIVILEGES ON DATABASE pocketnotes TO pkt_notes;
	\c pocketnotes $POSTGRES_USER;
	GRANT ALL ON SCHEMA public TO pkt_notes;
EOSQL