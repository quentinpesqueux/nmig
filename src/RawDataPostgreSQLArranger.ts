/*
 * This file is a part of "NMIG" - the database migration tool.
 *
 * Copyright (C) 2016 - present, Anatoly Khaytovich <anatolyuss@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program (please see the "LICENSE.md" file).
 * If not, see <http://www.gnu.org/licenses/gpl.txt>.
 *
 * @author Anatoly Khaytovich <anatolyuss@gmail.com>
 */
import { log } from './FsOps';
import Conversion from './Conversion';
import DBAccess from './DBAccess';
import IDBAccessQueryParams from './IDBAccessQueryParams';
import DBVendors from './DBVendors';

/**
 * Returns the raw data column's name.
 * This column will be silently added to each migrated table.
 * Its content is the a json-formatted data, that will be flatten later among table's regular columns.
 */
export const getRawDataColumnName = (schema: string, tableName: string): string => {
    return `"${ schema }_${ tableName }_raw_data"`;
};

/**
 * TODO: add description.
 */
export const createRawDataArrangerFunction = async (conversion: Conversion): Promise<Conversion> => {
    const logTitle: string = 'RawDataPostgreSQLArranger::arrangeRawData';
    const sql: string = `
        CREATE OR REPLACE FUNCTION arrange_raw_data
            (table_name TEXT, regular_columns TEXT, json_column TEXT)
            RETURNS TEXT LANGUAGE plpgsql AS $$
        DECLARE
            cols TEXT;
        BEGIN
            EXECUTE FORMAT ($ex$
                SELECT STRING_AGG(FORMAT('%2$s->>%%1$L "%%1$s"', key), ', ')
                FROM (SELECT DISTINCT key FROM %1$s, JSONB_EACH(%2$s) ORDER BY 1) s;
            $ex$, table_name, json_column)
            INTO cols;
            EXECUTE FORMAT($ex$
                DROP VIEW IF EXISTS %1$s_view;
                CREATE VIEW %1$s_view AS 
                SELECT %2$s, %3$s FROM %1$s $ex$, table_name, regular_columns, cols
            );
            RETURN cols;
        END $$;
    `;

    const params: IDBAccessQueryParams = {
        conversion: conversion,
        caller: logTitle,
        sql: sql,
        vendor: DBVendors.PG,
        processExitOnError: true,
        shouldReturnClient: false
    };

    await DBAccess.query(params);
    log(conversion, `\t--[${ logTitle }] The "arrange_raw_data" plpgsql function is created...`);
    return conversion;
};
