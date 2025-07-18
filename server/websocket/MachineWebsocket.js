const { Machine, MachineLog, DailyConfig } = require("../models");
const { literal, Op } = require("sequelize");
const {
  getMachineTimeline,
  countRunningTime,
  getShiftDateRange,
  handleGetCuttingTime,
} = require("../utils/machineUtils");
const { serverError } = require("../utils/serverError");

const DEFAULT_PERFECT_TIME = 24 * 60 * 60 * 1000; // 24 hour in milisecond

/**
 * Generates a description of the running time.
 *
 * @param {number} totalRunningMilliseconds - The total running time in milliseconds.
 * @param {number} perfectTime - The perfect running time in milliseconds (default: 24 hours in ms).
 * @returns {string} The running time description in format "X hour Y minute / A hour B minute".
 */
function countDescription(
  totalRunningMilliseconds,
  perfectTime = DEFAULT_PERFECT_TIME
) {
  const hours = Math.floor(totalRunningMilliseconds / (1000 * 60 * 60));
  const minutes = Math.floor(
    (totalRunningMilliseconds % (1000 * 60 * 60)) / (1000 * 60)
  );
  const perfectTimeHours = Math.floor(perfectTime / (1000 * 60 * 60));
  const perfectTimeMinutes = Math.floor(
    (perfectTime % (1000 * 60 * 60)) / (1000 * 60)
  );

  return `${hours} hour ${minutes} minute / ${perfectTimeHours} hour ${perfectTimeMinutes} minute`;
}

/**
 * Calculates the percentage of running time compared to perfect time.
 *
 * @param {number} runningMilliseconds - The running time in milliseconds.
 * @param {number} perfectTimeMs - The perfect running time in milliseconds (default: 24 hours in ms).
 * @returns {number} The percentage of running time (0-100).
 */
function percentage(runningMilliseconds, perfectTimeMs = DEFAULT_PERFECT_TIME) {
  const percentage = Math.round((runningMilliseconds / perfectTimeMs) * 100);
  return percentage;
}


module.exports = class MachineWebsocket {
  /**
   * Retrieves machine timelines and sends them to the client.
   *
   * @param {WebSocket} client - The WebSocket client instance.
   * @param {{shift: 0|1|2; date: string | Date}} data
   */
  static async timelines(client, data) {
    try {
      const { shift, date } = data;
      const nowDate = new Date(date);
      if (
        nowDate.toLocaleDateString("en-CA") >
        new Date().toLocaleDateString("en-CA")
      ) {
        return client.send(
          JSON.stringify({
            type: "timeline",
            data: {
              data: [],
              date
            },
          })
        );
      }
      const machineTimeline = await getMachineTimeline({
        date,
        shift,
      });
      if (!machineTimeline) {
        return client.send(
          JSON.stringify({
            type: "error",
            message: "No timeline data found",
          })
        );
      }

      client.send(JSON.stringify({ type: "timeline", data: machineTimeline }));
    } catch (e) {
      //  'No daily config for 2025-05-15'
      if (e.message.includes("No daily config")) {
        return client.send(
          JSON.stringify({
            type: "error",
            message: e.message,
          })
        );
      }
      serverError(e, "from refactor timelines");
      client.send(
        JSON.stringify({
          type: "error",
          message: "Failed to get timeline data",
        })
      );
    }
  }


  /**
   * Retrieves machine percentages and sends them to the client.
   * 
   * @param {WebSocket} client - The WebSocket client instance.
   * @param {{ date: string, shift: 0| 1 | 2 ; monthly?: boolean }} data - The data object containing date and shift.
   */
  static async percentages(client, data) {
    try {
      const { date, shift } = data;
      if (data.monthly) {
        // Handle monthly percentages
        const nowDate = new Date(date);
        if (nowDate.getTime() > new Date().getTime()) {
          return client.send(JSON.stringify({ type: "percentage", data: [] }));
        }

        let monthlyData;
        try {
          monthlyData = await handleGetCuttingTime(date);
        } catch (monthlyError) {
          if (monthlyError.message.includes("cutting time not found")) {
            return client.send(JSON.stringify({ type: 'error', message: 'No cutting time configuration found for this month' }));
          }
          throw monthlyError; // Re-throw to be caught by outer try-catch
        }

        if (!monthlyData || !monthlyData.data || monthlyData.data.length <= 1) {
          return client.send(JSON.stringify({ type: 'percentage', data: { date: nowDate, dateFrom: nowDate, dateTo: nowDate, data: [] } }));
        }

        // Get current day of month to calculate progress
        const currentDay = new Date().getDate();
        const requestedMonth = new Date(date).getMonth();
        const currentMonth = new Date().getMonth();
        const isCurrentMonth = requestedMonth === currentMonth;
        const lastDayWithData = isCurrentMonth ? Math.min(currentDay, monthlyData.allDateInMonth.length) : monthlyData.allDateInMonth.length;

        // Extract target data (first item in data array)
        const targetData = monthlyData.data.find(item => item.name === "TARGET");
        if (!targetData) {
          return client.send(JSON.stringify({ type: 'error', message: 'No target data found for this month' }));
        }

        const targetForDay = targetData.data.find(item => item.date === lastDayWithData);
        const targetHours = targetForDay ? targetForDay.count.calculate.combine : 0;
        const targetMs = targetHours * 60 * 60 * 1000; // Convert hours to milliseconds

        // Process each machine's data
        const machineResults = monthlyData.data
          .filter(item => item.name !== "TARGET")
          .map(machine => {
            const dayData = machine.data.find(item => item.date === lastDayWithData);
            if (!dayData) {
              return {
                name: machine.name,
                status: "Stopped",
                description: "0 hour 0 minute / 0 hour 0 minute",
                percentage: [0, 100]
              };
            }

            const actualHours = dayData.count.calculate.combine || 0;
            const actualMs = actualHours * 60 * 60 * 1000;

            const runningPercentage = percentage(actualMs, targetMs);
            const description = countDescription(actualMs, targetMs);

            return {
              name: machine.name,
              status: "Running", // Default status for monthly view
              description,
              percentage: [runningPercentage, 100 - runningPercentage]
            };
          });

        // Create date range for the month
        const firstDayOfMonth = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
        const lastDayOfMonth = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0);

        const monthlyResult = {
          date: nowDate,
          dateFrom: firstDayOfMonth,
          dateTo: lastDayOfMonth,
          data: machineResults.sort((a, b) => {
            const numberA = parseInt(a.name.slice(3));
            const numberB = parseInt(b.name.slice(3));
            return numberA - numberB;
          })
        };

        return client.send(JSON.stringify({ type: "percentage", data: monthlyResult }));
      }
      if (!date || shift < 0 || shift > 2) return client.send(JSON.stringify({ type: "error", message: "Bad request!" }));

      const nowDate = new Date(date)
      if (nowDate.getTime() > new Date().getTime()) {
        return client.send(JSON.stringify({ type: "percentage", data: [] }));
      }

      const { dateFrom, dateTo } = await getShiftDateRange(date, shift);
      // const { dateFrom, dateTo } = await getShiftDateRange(date, 0);
      const machinesWithLogs = await Machine.findAll({
        where: { is_zooler: false },
        attributes: [
          [
            literal(
              `CASE WHEN "type" IS NOT NULL THEN "name" || ' (' || "type" || ')' ELSE "name" END`
            ),
            "name",
          ],
        ],
        include: [
          {
            model: MachineLog,
            attributes: ["current_status", "createdAt"],
            where: {
              createdAt: {
                [Op.between]: [dateFrom, dateTo]
              }
            },
          },
        ],
        order: [[{ model: MachineLog }, "createdAt", "ASC"]],
      });

      if (!machinesWithLogs.length) {
        return client.send(JSON.stringify({ type: 'percentage', data: { dateFrom, dateTo, data: [] } }))
      }

      const isNowDate =
        nowDate.toLocaleDateString("en-CA") ===
        new Date().toLocaleDateString("en-CA");
      const calculateMs = new Date().getTime() - dateFrom.getTime();
      const perfectTime = isNowDate && shift === 0 ? calculateMs : dateTo.getTime() - dateFrom.getTime();


      const runningTimeMachines = machinesWithLogs.map((machine) => {
        const { name, MachineLogs } = machine.get({ plain: true });
        const lastLog = MachineLogs[MachineLogs.length - 1];
        let { totalRunningTime, lastRunningTimestamp } =
          countRunningTime(MachineLogs);

        // check if date is today
        if (lastRunningTimestamp && isNowDate) {
          const now = new Date().getTime();
          const diff = now - new Date(lastRunningTimestamp).getTime();
          totalRunningTime += diff;
        }
        // before today
        if (lastRunningTimestamp && !isNowDate) {
          const diff = dateTo.getTime() - new Date(lastRunningTimestamp).getTime();
          totalRunningTime += diff;
        }



        const runningTime = percentage(totalRunningTime ?? 0, perfectTime);

        const description = countDescription(
          totalRunningTime || 0,
          perfectTime
        );

        delete machine.MachineLogs;
        return {
          name,
          status: lastLog.current_status,
          description,
          percentage: [runningTime, 100 - runningTime],
        };
      });

      const formattedResult = {
        date: nowDate,
        dateFrom,
        dateTo,
        data: runningTimeMachines.sort((a, b) => {
          const numberA = parseInt(a.name.slice(3));
          const numberB = parseInt(b.name.slice(3));
          return numberA - numberB;
        }),
      };

      client.send(
        JSON.stringify({ type: "percentage", data: formattedResult })
      );
    } catch (error) {
      // message: 'No daily config for 2025-05-04'
      if (error.message.includes("No daily config")) {
        return client.send(JSON.stringify({ type: 'error', message: error.message }))
      }
      serverError(error, "from refactor percentages");
      client.send(
        JSON.stringify({ type: "error", message: "Failed to get percentage" })
      );
    }
  }
};