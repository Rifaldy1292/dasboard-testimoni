// dummy ada 15 mesin
const dummyresult = Array.from({ length: 15 }, (_, i) => ({
  machineName: `mc-${i + 1}`,
}));

// return [{ machineName: "mc-1", status: "Running" }]
const handleWebsocket = () => {
  const statuses = ['Running', 'Stopped'];
  const result = dummyresult.map((machine) => {
    const running = Math.floor(Math.random() * 100);
    // console.log('running', running);
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
