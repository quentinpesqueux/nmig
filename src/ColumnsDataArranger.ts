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
import { Encoding } from './Encoding';

/**
 * Defines if given type is one of MySQL spacial types.
 */
const isSpacial = (type: string): boolean => {
    return type.indexOf('geometry') !== -1
        || type.indexOf('point') !== -1
        || type.indexOf('linestring') !== -1
        || type.indexOf('polygon') !== -1;
};

/**
 * Defines if given type is one of MySQL binary types.
 */
const isBinary = (type: string): boolean => {
    return type.indexOf('blob') !== -1 || type.indexOf('binary') !== -1;
};

/**
 * Defines if given type is one of MySQL bit types.
 */
const isBit = (type: string): boolean => {
    return type.indexOf('bit') !== -1;
};

/**
 * Defines if given type is one of MySQL date-time types.
 */
const isDateTime = (type: string): boolean => {
    return type.indexOf('timestamp') !== -1 || type.indexOf('date') !== -1;
};

/**
 * Defines if given type is one of MySQL numeric types.
 */
const isNumeric = (type: string): boolean => {
    return type.indexOf('decimal') !== -1
        || type.indexOf('numeric') !== -1
        || type.indexOf('double') !== -1
        || type.indexOf('float') !== -1
        || type.indexOf('int') !== -1
        || type.indexOf('point') !== -1;
};

/**
 * Arranges columns data before loading.
 */
// TODO: consider to remove.
// export default (arrTableColumns: any[], mysqlVersion: string | number, encoding: Encoding): string => {
//     let strRetVal: string = '';
//     const wkbFunc: string = mysqlVersion >= 5.76 ? 'ST_AsWKB' : 'AsWKB';
//
//     arrTableColumns.forEach((column: any) => {
//         const field: string = column.Field;
//         const type: string  = column.Type;
//
//         if (isSpacial(type)) {
//             // Apply HEX(ST_AsWKB(...)) due to the issue, described at https://bugs.mysql.com/bug.php?id=69798
//             strRetVal += `HEX(${ wkbFunc }(\`${ field }\`)) AS \`${ field }\`,`;
//         } else if (isBinary(type)) {
//             strRetVal += `HEX(\`${ field }\`) AS \`${ field }\`,`;
//         } else if (isBit(type)) {
//             strRetVal += `BIN(\`${ field }\`) AS \`${ field }\`,`;
//         } else if (isDateTime(type)) {
//             strRetVal += `IF(\`${ field }\` IN('0000-00-00', '0000-00-00 00:00:00'), '-INFINITY', CAST(\`${ field }\` AS CHAR)) AS \`${ field }\`,`;
//         } else if (isNumeric(type)) {
//             strRetVal += `\`${ field }\` AS \`${ field }\`,`;
//         } else if (encoding === 'utf-8' || encoding === 'utf8') {
//             strRetVal += `REPLACE(\`${ field }\`, '\0', '') AS \`${ field }\`,`;
//         } else {
//             strRetVal += `\`${ field }\` AS \`${ field }\`,`;
//         }
//     });
//
//     return strRetVal.slice(0, -1);
// };

export default (tableColumns: any[], mysqlVersion: string | number, encoding: Encoding): string => {
    let retVal: string = '';
    const wkbFunc: string = mysqlVersion >= 5.76 ? 'ST_AsWKB' : 'AsWKB';

    tableColumns.forEach((column: any) => {
        const field: string = column.Field;
        const type: string  = column.Type;

        if (isSpacial(type)) {
            // Apply HEX(ST_AsWKB(...)) due to the issue, described at https://bugs.mysql.com/bug.php?id=69798
            retVal += `IF(\`${ field }\` IS NULL, '', CONCAT('"', IFNULL(CONCAT('\\x', HEX(${ wkbFunc }(\`${ field }\`))), '\\\\N'), '"')),`;
        } else if (isBinary(type)) {
            retVal += `IF(\`${ field }\` IS NULL, '', CONCAT('"', IFNULL(CONCAT('\\x', HEX(\`${ field }\`)), '\\\\N'), '"')),`;
        } else if (isBit(type)) {
            retVal += `IF(\`${ field }\` IS NULL, '', CONCAT('"', IFNULL(CONCAT("B'", BIN(\`${ field }\`), "'"), '\\\\N'), '"')),`;
        } else if (isDateTime(type)) {
            retVal += `IF(\`${ field }\` IS NULL, '', CONCAT('"', IF(\`${ field }\` IN('0000-00-00', '0000-00-00 00:00:00'), '-INFINITY', IFNULL(CAST(\`${ field }\` AS CHAR), '\\\\N')), '"')),`;
        } else if (isNumeric(type)) {
            // retVal += `IFNULL(CAST(\`${ field }\` AS CHAR), ''),`;
            retVal += `CONCAT('"', IFNULL(CAST(\`${ field }\` AS CHAR), ''), '"'),`;
        } else if (encoding === 'utf-8' || encoding === 'utf8') {
            retVal += `IF(\`${ field }\` IS NULL, '',  CONCAT('"', REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(\`${ field }\`, '\\b', '\\\\b'),`
                + ` '\\n', '\\\\n'), '\\t', '\\\\t'), '\\f', '\\\\f'), '\\r', '\\\\r'), '\\v', '\\\\v'), '\0', ''),`
                + `  '"')),`;
        } else {
            retVal += `IF(\`${ field }\` IS NULL, '', CONCAT('"', REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(\`${ field }\`, '\\b', '\\\\b'),`
                + ` '\\n', '\\\\n'), '\\t', '\\\\t'), '\\f', '\\\\f'), '\\r', '\\\\r'), '\\v', '\\\\v'),`
                + `  '"')),`;
        }
    });

    return `CONCAT_WS(',', ${ retVal.slice(0, -1) }) AS nmigCsvData `;
};
