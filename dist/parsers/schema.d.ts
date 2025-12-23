import { Schema } from '../types';
export declare class SchemaParser {
    /**
     * Parse a JSON schema and generate mock data based on the schema definition
     */
    static parse(schema: Schema): any;
    private static generateString;
    private static generateNumber;
    private static generateBoolean;
    private static generateArray;
    private static generateObject;
}
