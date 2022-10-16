const delayBetweenFetch = 1000;
const fetchesPerLogFile = 100000;
const maxRetries = 2; // Should not be less than 2 !!! Else there will be no chance for re-auth
const { axios } = require("./altel_axios.cjs");
const { doLogin, getAuthHeader, PostXml } = require("./altel_utils.cjs");
const { xml2js } = require("xml-js");
const sortObject = require("sort-object-keys");
const { appendFileSync } = require("fs");
const {getTsStr} = require("./getTsStr.cjs");

async function doAuth() {
    const rr = await doLogin("admin", "Lo@121351");
}

function recurPostParseReplace(obj, prop) {
    if (prop === undefined) {
        for (const prop in obj) {
            recurPostParseReplace(obj, prop);
        }
    } else {
        let oldV = obj[prop];
        let newV = oldV;

        if (typeof oldV === "object") {
            // Replace text-only nodes with text itself
            if (Object.keys(oldV).length === 1 && typeof oldV._text === "string") {
                newV = oldV._text;
            } else {
                recurPostParseReplace(newV);
            }
        }

        if (oldV !== newV) {
            obj[prop] = newV;
        }
    }
    return obj;
}

async function getAntenaData() {
    for (let retryIndex = 0; retryIndex < maxRetries; retryIndex++) {
        try {
            const resp = await PostXml("cm", "get_eng_info", null, "clearInterval");
            const rawXmlData = resp.data;
            const rawJsonData = xml2js(rawXmlData, { compact: true });
            const jsonData = recurPostParseReplace(xml2js(rawXmlData, { compact: true }));
            const antenaData0 = jsonData?.RGW?.eng?.lte;
            if (!antenaData0) {
                await doAuth();
                continue;
            }
            const antenaData = { ts: getTsStr(), ...sortObject(antenaData0) };
            return antenaData;
        } catch (e) {}
        try {
            await doAuth();
        } catch (e) {}
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// delayBetweenFetch
function genLogFileName() {
    const suffix = getTsStr().split("T").join("_").split(":").join("-").split(".").join("_").substring(0, 23);
    return `antena_${suffix}.tsv`;
}

async function main() {
    while (true) {
        let logFileName = genLogFileName();
        let isNewLog = true;

        {
        const antenaData = await getAntenaData();
        const headerStr = Object.keys(antenaData).join("\t")+"\n";
        await appendFileSync(logFileName, headerStr);
        }

        for (let logLineIndex = 0; logLineIndex < fetchesPerLogFile; logLineIndex++) {
            const antenaData = await getAntenaData();
            const dataStr = Object.values(antenaData).join("\t")+"\n";
            await appendFileSync(logFileName, dataStr);
            await sleep(delayBetweenFetch);
        }
    }
}
main();
