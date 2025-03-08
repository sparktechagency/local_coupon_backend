const validateHoursOfOperation = (
  arr: Array<{ day: string; hours: string }>
) => {
  if (arr.length !== 7) {
    return {
      message:
        "Invalid hours of operation format. Input data for all 7 days of the week.",
    };
  }

  const validDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  for (let i = 0; i < arr.length; i++) {
    const { day, hours } = arr[i];

    if (!day || !hours) {
      return {
        message: `Missing 'day' or 'hours' key in entry ${i + 1}.`,
      };
    }

    if (!validDays.includes(day)) {
      return {
        message: `Invalid day '${day}' in entry ${i + 1}.`,
      };
    }

    const hoursPattern =
      /^([0-9]{2}:[0-9]{2} [APM]{2}) - ([0-9]{2}:[0-9]{2} [APM]{2})$/;
    if (hours !== "Closed" && !hoursPattern.test(hours)) {
      return {
        message: `Invalid hours format in entry ${
          i + 1
        }. The correct format is 'hh:mm AM/PM - hh:mm AM/PM' or 'Closed'.`,
      };
    }
  }

  return false;
};

export default validateHoursOfOperation;
