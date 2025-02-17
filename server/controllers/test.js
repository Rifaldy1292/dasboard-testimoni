const example = [1, 2, 3, 4, 9, 0, 2, 0, 1, 0]
// expect res[1, 3, 6, 10, 19, 19, 21, 21, 22, 22]
// [value index 0, value index 0 + 1, value index 0, 1, 2]

const res = []

for (let i = 0; i < example.length; i++) {
    let sum = 0
    for (let j = 0; j <= i; j++) {
        sum += example[j]
    }
    res.push(sum)
}
console.log(res)

function totalHour(runningHour) {
    const hour = Math.round(runningHour / (1000 * 60 * 60));
    const minute = Math.round((runningHour / (1000 * 60)) % 60);
    const totalHour = `${hour}.${minute}`;
    return totalHour;
}

// expect jam dengan 1 dibelakang koma
const convertMiliseondToHours = (milliseconds) => {
    const seconds = milliseconds / 1000;
    const minute = seconds / 60;
    const hours = minute / 60;
    return hours.toFixed(1);
}

console.log(convertMiliseondToHours(9028231))