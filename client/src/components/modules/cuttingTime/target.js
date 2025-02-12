const target = 600; // Total target hours for the month

function getTarget() {
    const date = new Date();
    const month = date.getMonth();
    const year = date.getFullYear();
    const totalDayInMonth = new Date(year, month + 1, 0).getDate(); // Get number of days in the current month

    const targetPerDay = target / totalDayInMonth; // Calculate target hours per day

    const calculatedTargets = Array.from({ length: totalDayInMonth }, (_, i) => (i + 1) * targetPerDay); // Calculate cumulative target for each day

    const formattedResult = calculatedTargets.map((item) => Math.round(item))
    // console.log({ test, length: test.length });

    return formattedResult;
}

console.log(getTarget()); // Call the function and log the result

