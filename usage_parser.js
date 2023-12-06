class UsageParser {
    static #PROCESS_HEX = `6`
    static #PROCESS_EXTENDED = `4`

    /** parse
     *  Given an input or collection of inputs following the pattern <ID>,<Data>, parses the model into a more usable object
     * @param {string | string[]} input data to parse
     * @returns an array of objects following the pattern {
     *      id: number,
     *      dmcc: string | null,
     *      mnc: number | null,
     *      bytes_used: number | null,
     *      cellid: number | null,
     *      ip: string | null
     * }
     * notes: 
     *  IP will ALWAYS be formatted correctly, otherwise it will be null.
     *  invalid inputs will be returned as null, as will be fields.
     */
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

    

    static #parseSingle(input) {
        var formattedInput = this.#validateInput(input);
        if (!formattedInput.isValid)
            return null;

        switch (formattedInput.format) {
            case this.#PROCESS_EXTENDED:
                return this.#parseExtended(formattedInput.tokens);
            case this.#PROCESS_HEX:
                return this.#parseHex(formattedInput.tokens);
            default:
                return this.#parseBasic(formattedInput.tokens);
        }
    }

    /**
     * 
     * @param {string[]} tokens - data to parse
     */
    static #parseBasic(tokens) {
        const [id, bytes_used] = tokens;
        return this.#formatOutput(id, undefined, bytes_used);
    }

    /**
     * 
     * @param {string[]} tokens - data to parse
     */
    static #parseHex(tokens) {
        const id = tokens[0];

        // Validate we get exactly 24 hex characters (nibbles)
        const valid = /^[0-9a-f]{24}$/.test(tokens[1]);
        if (!valid)
            return null;
        const nibbles = tokens[1];

        // Parse hex sets into values
        const mnc = parseInt(nibbles.substring(0, 4), 16);
        const bytes_used = parseInt(nibbles.substring(4,8), 16);
        const cellid = parseInt(nibbles.substring(8,16), 16);
        const ip = `${parseInt(nibbles.substring(16,18), 16)}` +
                   `.${parseInt(nibbles.substring(18,20), 16)}` +
                   `.${parseInt(nibbles.substring(20,22), 16)}` +
                   `.${parseInt(nibbles.substring(22,24), 16)}`;

        return this.#formatOutput(id, mnc, bytes_used, undefined, cellid, ip);
    }

    /**
     * 
     * @param {string[]} tokens - data to parse
     */
    static #parseExtended(tokens) {
        const [   
            id,
            dmcc,
            mnc,
            bytes_used,
            cellid
        ] = tokens;
        return this.#formatOutput(id, mnc, bytes_used, dmcc, cellid);
    }

    static #formatOutput(id, mnc, bytes_used, dmcc, cellid, ip) {
        // IP should be [0-256].[0-256].[0-256].[0-256]
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

    /** validateInput
     *  Analyzes data input and determines whether the data is valid and, if it is, determines how we should handle the data.
     * @param {*} input 
     * @returns 
     */
    static #validateInput(input) {
        const response = {
            isValid: false,
            format: ``,
            tokens: null
        }
        if ((!typeof input) == `string`)
            return response;

        response.tokens = input.split(`,`);
        if (response.tokens.length < 2)
            return response;

        response.format = response.tokens[0].slice(-1);
        response.isValid = true;
        return response;
    }
}

export default UsageParser;
