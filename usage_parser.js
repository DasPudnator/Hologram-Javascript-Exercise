class UsageParser {
    /** [PRIVATE] parsingMethods
     *  This array represents the available methods for parsing inputs. If you want to add additional parsing methods, DO NOT modify the parse/parseSingle methods.
     *  Add a new parsing method here with the following properties:
     *  Name {string}: What is it called? used for debugging
     *  isValid {function(data): boolean}: Return false if this data is not formatted correctly. Data can be assumed to be non-null.
     *  applyIf: {function(id): boolean}: Return true if, for the given id, you would want this to be your method of choice.
     *  process: {function(id, data): object}: How to handle the data, use the formatOutput Method to make sure the object satisfies formatting standards
     * 
     *  Note: 
     *  methods are on a first-come, first-served method, so if 2 methods could match the same ID, it will take the first one it finds. 
     *  As such, default should always be last. */
    static #parsingMethods = [
        {   name: `HEX`,
            applyIf: (id) => id.slice(-1) == `6`,
            isValid: (data) => /^[0-9a-f]{24}$/.test(data),
            process: (id, data) => {
                // Parse hex sets into values
                const mnc = parseInt(data.substring(0, 4), 16);
                const bytes_used = parseInt(data.substring(4,8), 16);
                const cellid = parseInt(data.substring(8,16), 16);
                const ip = `${parseInt(data.substring(16,18), 16)}` +
                           `.${parseInt(data.substring(18,20), 16)}` +
                           `.${parseInt(data.substring(20,22), 16)}` +
                           `.${parseInt(data.substring(22,24), 16)}`;
        
                return this.#formatOutput(id, mnc, bytes_used, undefined, cellid, ip);
            }
        },
        {   name: `EXTENDED`,
            applyIf: (id) => id.slice(-1) == `4`,
            isValid: (data) => data.split(',').length == 4,
            process: (id, data) => {
                const [dmcc, mnc, bytes_used, cellid ] = data.split(',');
                return this.#formatOutput(id, mnc, bytes_used, dmcc, cellid);
            }
        },
        {   name: `DEFAULT`,
            applyIf: (id) => true,
            isValid: (data) => !isNaN(data),
            process: (id, data) => this.#formatOutput(id, undefined, data)
        }
    ]

    /** parse
     *  Given an input or collection of inputs following the pattern <ID>,<Data>, parses the model into a more usable object
     * @param {string | string[]} input data to parse
     * @returns {{
     *      id: number,
     *      dmcc: string | null,
     *      mnc: number | null,
     *      bytes_used: number | null,
     *      cellid: number | null,
     *      ip: string | null
     * }[]} input formatted into an array of clean objects
     * notes: 
     *  IP will ALWAYS be formatted correctly, otherwise it will be null.
     *  Invalid inputs will be returned as null, as well as any fields. */
    static parse(input) {
        if (Array.isArray(input)) {
            const output = [];
            input.forEach((string) => {
                output.push(this.#parseSingle(string));
            });
            
            return output;
        }
        return [this.#parseSingle(input)];
    }

    /** [PRIVATE] parseSingle
     *  For a given input, generates a more user-friendly model using the system formatters
     * @param {string} input text to parse 
     * @returns {{
     *      id: number,
     *      dmcc: string | null,
     *      mnc: number | null,
     *      bytes_used: number | null,
     *      cellid: number | null,
     *      ip: string | null
     * }}
     *  IP will ALWAYS be formatted correctly, otherwise it will be null.
     *  Invalid inputs will be returned as null, as will any invalid fields. */
    static #parseSingle(input) {
        if ((!typeof input) == `string`)
            return null;
        const firstCommaIx = input.indexOf(",");
        if (firstCommaIx < 0) // No Comma, Bad Data
            return null;

        // Format input to values consumable by formatters and find the right formatter
        const id = input.substr(0, firstCommaIx);
        const data = input.substr(firstCommaIx + 1);
        const formatter = this.#getFormatter(id);
        if (!formatter.isValid(data))
            return null;
        
        console.log(`Formatter ${formatter.name}: Data for ID: ${id} is valid`)
        return formatter.process(id, data);
    }

    /** [PRIVATE] getFormatter
     *  For a given id, find the formatter most suited to processing the field
     * @param {string} id - record ID to match for formatter pattern
     * @returns a formatter object that best serves this id */
    static #getFormatter(id) {
        for(let x = 0; x < this.#parsingMethods.length; x++) {
            const formatter = this.#parsingMethods[x];
            if (formatter.applyIf(id)) 
                return formatter;
        }
        return null;
    }

    /** [PRIVATE] formatOutput
     *  Generates a consisten format matching output recommendations for the parser
     * @param {string | number | null} id 
     * @param {string | number | null} mnc 
     * @param {string | number | null} bytes_used 
     * @param {string | null} dmcc 
     * @param {string | number | null} cellid 
     * @param {string | null} ip 
     * @returns {{
     *      id: number,
     *      dmcc: string | null,
     *      mnc: number | null,
     *      bytes_used: number | null,
     *      cellid: number | null,
     *      ip: string | null
     * }} object with the inputs mapped to the same-named field, cleaned up to handle bad numbers or other input fumbles. */
    static #formatOutput(id, mnc, bytes_used, dmcc, cellid, ip) {
        // IP should be [0-255].[0-255].[0-255].[0-255]
        const isValidIp = ip == null ? false :
                    /(\b25[0-5]|\b2[0-4][0-9]|\b[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}/.test(ip);
                
        // Outputs should always match a specific data type, so let's do some validation here, and return null on failure.
        return {
            id: isNaN(id) ? null: Number(id),
            dmcc: (typeof dmcc) == "string" ? dmcc : null,
            mnc: isNaN(mnc) ? null : Number(mnc),
            bytes_used: isNaN(bytes_used) ? null : Number(bytes_used),
            cellid: isNaN(cellid) ? null : Number(cellid),
            ip: isValidIp ? ip : null
        }
    }
}

export default UsageParser;
