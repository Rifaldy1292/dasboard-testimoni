const target = 600; // Total target hours for the month


function getTarget() {
    const date = new Date();
    const month = date.getMonth();
    const year = date.getFullYear();
    const totalDayInMonth = new Date(year, month + 1, 0).getDate(); // Get number of days in the current month

    const targetPerDay = (target / totalDayInMonth).toFixed(1); // Calculate target hours per day

    return Array.from({ length: totalDayInMonth }, () => Number(targetPerDay));
}


console.log(getTarget()); // Call the function and log the result

