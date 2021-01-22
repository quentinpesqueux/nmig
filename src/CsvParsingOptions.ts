export default class CsvParsingOptions {
    /**
     * The csv delimiter.
     */
    public delimiter: string;

    /**
     * The indicator whether to use headers.
     */
    public header: boolean;

    /**
     * A list of columns.
     */
    public fields: string[];

    /**
     * CsvParsingOptions constructor.
     */
    public constructor(delimiter: string, header: boolean, fields: string[]) {
        this.delimiter = delimiter;
        this.header = header;
        this.fields = fields;
    }
}
