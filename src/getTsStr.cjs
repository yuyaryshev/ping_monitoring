const timezoneDiff = 6;
function getTsStr(dateStr) {
    let d = dateStr ? new Date(dateStr) : new Date();
    d.setTime(d.getTime()+(timezoneDiff*60*60*1000));
    return d.toISOString();
}
module.exports = {getTsStr};