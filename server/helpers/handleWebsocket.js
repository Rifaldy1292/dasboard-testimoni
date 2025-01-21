// dummy ada 15 mesin

const dummyresult = [
  {
    machineName: "f230fh0g3",
  },
  {
    machineName: "f230fh0g4",
  },
  {
    machineName: "f230fh0g5",
  },
  {
    machineName: "f230fh0g6",
  },
  {
    machineName: "f230fh0g7",
  },
  {
    machineName: "f230fh0g8",
  },
  {
    machineName: "f230fh0g9",
  },
  {
    machineName: "f230fh0g10",
  },
  {
    machineName: "f230fh0g11",
  },
  {
    machineName: "f230fh0g12",
  },
  {
    machineName: "f230fh0g13",
  },
  {
    machineName: "f230fh0g14",
  },
  {
    machineName: "f230fh0g15",
  },
  {
    machineName: "f230fh0g16",
  },
  {
    machineName: "f230fh0g17",
  },
];

/**
 * Converts a number status to a string status
 * @param {number} number The number status
 * @returns {string} The string status
 */
const handleNumberStatus = (number) => {
  if (number === 3) return "Running";
  return "Stop";
};

// { machineName: "asaas", status: 3 }

const handleWebsocket = () => {
  // generate random number 0-4
  //   console.log(random);
  const statuses = ['Running', 'Stopped'];
  const result = dummyresult.map((machine) => {
    const running = Math.floor(Math.random() * 100);
    return {
      ...machine,
      status: statuses[Math.floor(Math.random() * 5)],
      // percentage[0] = running, [1] = stop
      percentage: [running, 100 - running],
      // percentage: {
      //   running,
      //   stopped: 100 - running,
      // },
    };
  });
  //   console.log(result);
  return result;
};

module.exports = handleWebsocket;
