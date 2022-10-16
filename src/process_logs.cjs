const antenaLogFilename = "antena_2022-10-15_18-20-14_599.tsv";
const pingLogFilename = "ping_my_linode_log.txt";

const fs = require("fs");
const readline = require("readline");
const {getTsStr} = require("./getTsStr.cjs");
const infiniteTsDiff = 22000000;

function tsDiff(a, b) {
    return new Date(a).getTime() - new Date(b).getTime();
}

async function main() {
    const rawPingLog = fs.readFileSync("../copy/" + pingLogFilename, "utf-8").split("\n");
    const antenaLog = fs
        .readFileSync("../copy/" + antenaLogFilename, "utf-8")
        .split("\n")
        .map((s) => s.split("\t").map((s) => s.trim()));
    const antenaHeaders = antenaLog.shift();
    const emptyAntenaItem = antenaHeaders.map(() => "");
    let antenaApproxIndex = 5;

    const resultingHeaders = ["ping_ts", "ping_ms", ...antenaHeaders];
    const resultingLog = [resultingHeaders];
    let headerFinished = false;

    for await (const line of rawPingLog) {
        if (line.includes("18:20:29")) {
            debugger;
        }

        if (!headerFinished && !line.startsWith("Pinging")) {
            continue;
        }
        headerFinished = true;

        const pingItem = parsePingItem(line);
        if (!pingItem) {
            continue;
        }

        while (true) {
            const lastLogItem = antenaLog[antenaApproxIndex + 5];
            if (!lastLogItem) {
                break;
            }
            const ts_antena = lastLogItem[0];
            if (tsDiff(pingItem.ts, ts_antena) > 0) {
                antenaApproxIndex++;
            } else {
                break;
            }
        }

        let bestDiff = infiniteTsDiff;
        let bestAntenaItemIndex = antenaApproxIndex;
        let bestAntenaItem;
        for (let i = antenaApproxIndex - 5; i < antenaApproxIndex + 5; i++) {
            const antena_item = antenaLog[i];
            if (!antena_item) {
                continue;
            }
            const antenaCandidateTs = antena_item[0];
            const ts_diff = Math.abs(tsDiff(pingItem.ts, antenaCandidateTs));
            if (bestDiff > ts_diff) {
                bestDiff = ts_diff;
                bestAntenaItem = antena_item;
                bestAntenaItemIndex = i;
            }
        }
        antenaApproxIndex = bestAntenaItemIndex;

        const resultingLogItem = [pingItem.ts, pingItem.ms, ...(bestDiff < infiniteTsDiff ? bestAntenaItem : emptyAntenaItem)];
        resultingLog.push(resultingLogItem);
    }

    const resultingLogStr = resultingLog.map((item) => item.join("\t")).join("\n") + "\n";
    fs.writeFileSync("resulting_log.tsv", resultingLogStr, "utf-8");
}

function parsePingItem(s) {
    const pDivider = s.indexOf(": ");
    if (pDivider < 20 || pDivider > 27) {
        return undefined;
    }
    const ts = getTsStr(s.split(": ")[0]);
    const isTimedOut = s.includes("Timeout") || s.includes("network unreachable") || !s.includes(": bytes");
    const ms = isTimedOut ? 1000000 : +s.split(" time=")[1].split("ms")[0];
    return { ts, ms };
}

main();

// const pingItemExample1 = '2022-10-15 18:43:19.628: From 172.104.245.78: bytes=60 seq=2e6b TTL=47 ID=2dc4 time=127.305ms';
// const pingItemExample2 = '2022-10-15 18:08:20.007: Timeout waiting for seq=1dfe';
// console.log(parsePingItem(pingItemExample1));
