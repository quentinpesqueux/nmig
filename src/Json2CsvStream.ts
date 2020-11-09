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
const { parse } = require('json2csv'); // No declaration file for module "json2csv".

process.on('message', (record: any) => {
    let tableColumns: string[];
    let delimiter: string;

    if (record.csvMeta) {
        tableColumns = record.csvMeta.tableColumns.split(',');
        delimiter = record.csvMeta.delimiter;
    }

    const csv: string = parse(record, {
        // @ts-ignore
        fields: tableColumns,
        // @ts-ignore
        delimiter: delimiter,
        header: false
    });

    if (process.send) {
        console.log('======= From Parser ===========\n' + csv); /////////// TODO: remove asap. ////////////
        process.send(csv);
    }
});
