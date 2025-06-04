const groupLogByShiftInDateConfig = Array.isArray(allConfigInMonth) && allConfigInMonth.map((config) => {
    const { date, startFirstShift, endFirstShift, startSecondShift, endSecondShift } = config;

    // example startFirstShift: "07:00:00"
    const [startHour1, startMinute1, startSecond1] = startFirstShift.split(':').map(Number);
    const [endHour1, endMinute1, endSecond1] = endFirstShift.split(':').map(Number);
    const [startHour2, startMinute2, startSecond2] = startSecondShift.split(':').map(Number);
    const [endHour2, endMinute2, endSecond2] = endSecondShift.split(':').map(Number);

    const dateConfig = new Date(date);
    const startShift1 = new Date(date);
    const endShift1 = new Date(date);
    const startShift2 = new Date(date);
    const endShift2 = new Date(date);

    // Set hours, minutes, seconds, and milliseconds to 0
    startShift1.setHours(startHour1, startMinute1, startSecond1, 0);
    endShift1.setHours(endHour1, endMinute1, endSecond1, 0);
    startShift2.setHours(startHour2, startMinute2, startSecond2, 0);
    endShift2.setHours(endHour2, endMinute2, endSecond2, 0);
    // shift 2 is end is next day
    endShift2.setDate(endShift2.getDate() + 1);

    // Define time range checkers
    const betweenLogCombine = (logDate) => logDate.getTime() >= startShift1.getTime() && logDate.getTime() <= endShift2.getTime();
    const betweenLog1 = (logDate) => logDate.getTime() >= startShift1.getTime() && logDate.getTime() <= endShift1.getTime();
    const betweenLog2 = (logDate) => logDate.getTime() >= startShift2.getTime() && logDate.getTime() <= endShift2.getTime();

    // filter logs by shift
    const logCombineShift = MachineLogs.filter((log) => betweenLogCombine(new Date(log.createdAt)));
    const logShift1 = MachineLogs.filter((log) => betweenLog1(new Date(log.createdAt)));
    const logShift2 = MachineLogs.filter((log) => betweenLog2(new Date(log.createdAt)));


    // count running time
    const runningTimeCombineShift = countRunningTime(logCombineShift);
    const runningTime1 = countRunningTime(logShift1);
    const runningTime2 = countRunningTime(logShift2);

    let countCombineShift = runningTimeCombineShift.totalRunningTime;
    let count1 = runningTime1.totalRunningTime;
    let count2 = runningTime2.totalRunningTime;

    const isNowDate = (date) => date.toLocaleDateString() === new Date().toLocaleDateString() && date.getHours() >= startHour1

    // Handle current running calculation
    if (runningTimeCombineShift.lastRunningTimestamp) {
        const lastRunningDate = new Date(runningTimeCombineShift.lastRunningTimestamp);
        if (isNowDate(lastRunningDate) && betweenLogCombine(lastRunningDate)) {
            countCombineShift += new Date().getTime() - lastRunningDate.getTime();
        } else {
            countCombineShift += endShift2.getTime() - lastRunningDate.getTime();
        }

    }

    if (runningTime1.lastRunningTimestamp) {
        const lastRunningDate = new Date(runningTime1.lastRunningTimestamp);
        if (isNowDate(lastRunningDate) && betweenLog1(lastRunningDate)) {
            count1 += new Date().getTime() - lastRunningDate.getTime();
        } else {
            count1 += endShift1.getTime() - lastRunningDate.getTime();
        }

    }

    if (runningTime2.lastRunningTimestamp) {
        const lastRunningDate = new Date(runningTime2.lastRunningTimestamp);
        if (isNowDate(lastRunningDate) && betweenLog2(lastRunningDate)) {
            count2 += new Date().getTime() - lastRunningDate.getTime();
        } else {
            count2 += endShift2.getTime() - lastRunningDate.getTime();
        }
    }
    // Debug logging
    console.log(`Machine: ${name}, Date: ${dateConfig.getDate()}`);
    console.log(`Shift1 range: ${startShift1.toISOString()} - ${endShift1.toISOString()}`);
    console.log(`Shift2 range: ${startShift2.toISOString()} - ${endShift2.toISOString()}`);
    console.log(`Combined range: ${startShift1.toISOString()} - ${endShift2.toISOString()}`);
    console.log(`Shift1 logs count: ${logShift1.length}`);
    console.log(`Shift2 logs count: ${logShift2.length}`);
    console.log(`Combined logs count: ${logCombineShift.length}`);
    console.log(`Count1: ${convertMilisecondToHour(count1)}`);
    console.log(`Count2: ${convertMilisecondToHour(count2)}`);
    console.log(`CountCombineShift: ${convertMilisecondToHour(countCombineShift)}`);
    console.log(`Sum (count1 + count2): ${convertMilisecondToHour(count1 + count2)}`);
    console.log('---');


    return {
        date: dateConfig.getDate(),
        count: {
            combine: count1 + count2,
            combineTest: countCombineShift,
            shift1: count1,
            shift2: count2,
        },
        shifts: {
            // without second
            combine: `${startFirstShift.slice(0, -3)} - ${endSecondShift.slice(0, -3)}`,
            shift1: `${startFirstShift.slice(0, -3)} - ${endFirstShift.slice(0, -3)}`,
            shift2: `${startSecondShift.slice(0, -3)} - ${endSecondShift.slice(0, -3)}`,
        }
    };
});


